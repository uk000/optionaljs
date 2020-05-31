import 'mocha'
import Optional, {Present, MultiPresent} from './optional'

describe('Optional', () => {
  it('returns item from optional', () => {
    expect(Optional.of("item").get()).toBe("item");
    expect(Optional.ofNullable("item").get()).toBe("item");
  })

  it('invalid instantiation throws ', () => {
    expect(() => Optional.of(null)).toThrow()
    expect(() => Optional.empty().get()).toThrow()
    expect(() => new Present(null)).toThrow()
    expect(() => new Present(null, 123)).toThrow()
    expect(() => new Present(undefined)).toThrow()
    expect(() => MultiPresent.fromTwoValues(null, null)).toThrow()
    expect(() => MultiPresent.fromArray(null)).toThrow()
  })

  it('Optional.if', () => {
    expect(Optional.if(true).isPresent()).toBe(true)
    expect(Optional.if(false).isPresent()).toBe(false)
    expect(Optional.if(true).isEmpty()).toBe(false)
    expect(Optional.if(false).isEmpty()).toBe(true)
  })

  it('Optional.isPresent', () => {
    expect(Optional.of("foo").isPresent()).toBe(true)
    expect(Optional.ofNullable("foo").isPresent()).toBe(true)
    expect(Optional.empty().isPresent()).toBe(false)
    expect(Optional.ofNullable(null).isPresent()).toBe(false)
  })

  it('Optional.isEmpty', () => {
    expect(Optional.of("foo").isEmpty()).toBe(false)
    expect(Optional.ofNullable("foo").isEmpty()).toBe(false)
    expect(Optional.empty().isEmpty()).toBe(true)
    expect(Optional.ofNullable(null).isEmpty()).toBe(true)
  })

  it('Optional.ifPresent and then', () => {
    Optional.of("foo").ifPresent(val => expect(val).toBe("foo"))
    Optional.ofNullable("foo").ifPresent(val => expect(val).toBe("foo"))
    Optional.empty().ifPresent(val => {throw new Error("Empty should not be present")})
    Optional.ofNullable(null).ifPresent(val => {throw new Error("Empty should not be present")})

    Optional.of("foo").then(val => expect(val).toBe("foo"))
    Optional.ofNullable("foo").then(val => expect(val).toBe("foo"))
    Optional.empty().then(val => expect(val).toBe(undefined))
    Optional.ofNullable(null).then(val => expect(val).toBe(undefined))

    Optional.of("a").and("b").then(([a,b]) => expect(a).toBe("a"))

    let callback = jest.fn()
    Optional.of("a").and(null).then(() => callback())
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('Optional.ifEmpty', () => {
    const callback = jest.fn()
    Optional.empty().ifEmpty(() => callback())
    expect(callback).toHaveBeenCalledTimes(1)
    Optional.ofNullable(null).ifEmpty(() => callback())
    expect(callback).toHaveBeenCalledTimes(2)
    Optional.of("foo").ifEmpty(() => {throw new Error("Empty should not be present")})
    Optional.ofNullable("foo").ifEmpty(() => {throw new Error("Empty should not be present")})
  })

  it('Optional.filter', () => {
    expect(Optional.of("foo").filter(s => s === "foo").isPresent()).toBe(true)
    expect(Optional.of("foo").filterEach(s => s === "foo").isPresent()).toBe(true)
    expect(Optional.ofNullable("foo").filter(s => s === "foo").isPresent()).toBe(true)
    expect(Optional.ofNullable("foo").filter(s => s === "bar").isPresent()).toBe(false)
    expect(Optional.ofNullable("foo").filterEach(s => s === "bar").isPresent()).toBe(false)
    expect(Optional.empty().filter(s => true).isPresent()).toBe(false)
    expect(Optional.empty().filterEach(s => true).isPresent()).toBe(false)
    expect(Optional.ofNullable(null).filter(s => true).isPresent()).toBe(false)
  })

  it('Optional.map', () => {
    expect(Optional.of("foo").map(s => s).get()).toBe("foo")
    expect(Optional.of("foo").map(s => s+"bar").get()).toBe("foobar")
    expect(Optional.ofNullable("foo").map(s => s).get()).toBe("foo")
    expect(Optional.ofNullable("foo").map(s => s+"bar").get()).toBe("foobar")
    expect(Optional.empty().map(s => s+"bar").isPresent()).toBe(false)
    expect(Optional.ofNullable(null).map(s => s+"bar").isPresent()).toBe(false)

    const f = val => val * 2
    const g = val => val * 3
    expect(Optional.ofNullable(10).map(val => f(val)).map(val => g(val)).get())
        .toBe(Optional.ofNullable(10).map(val => g(val)).map(val => f(val)).get())

    // Covariance (compile-time check)
    class Parent {}
    class ChildA extends Parent {}
    class ChildB extends Parent {}
    class GrandChild extends ChildA {}

    const type0 : Optional<Parent> = Optional.ofNullable(new ChildA()).map(o => new GrandChild()).get();
    const type1 : Optional<ChildA> = Optional.ofNullable(new ChildA()).map(o => new GrandChild()).get();
    const type2 : Optional<GrandChild> = Optional.ofNullable(new ChildA()).map(o => new GrandChild()).get();
    //this must not have passed compilation
    const type3 : Optional<ChildB> = Optional.ofNullable(new ChildA()).map(o => new GrandChild()).get();
  })

  it('Optional.flatMap', () => {
    expect(Optional.of("foo").flatMap(s => Optional.of(s)).get()).toBe("foo")
    expect(Optional.of("foo").flatMap(s => null).isPresent()).toBe(false)
    expect(Optional.of("foo").flatMap(s => Optional.of(s+"bar")).get()).toBe("foobar")
    expect(Optional.ofNullable("foo").flatMap(s => Optional.of(s)).get()).toBe("foo")
    expect(Optional.ofNullable("foo").flatMap(s => Optional.of(s+"bar")).get()).toBe("foobar")
    expect(Optional.empty().flatMap(s => Optional.of(s+"bar")).isPresent()).toBe(false)
    expect(Optional.ofNullable(null).flatMap(s => Optional.of(s+"bar")).isPresent()).toBe(false)

    const f = val => Optional.of(val * 2)
    const g = val => Optional.of(val * 3)
    expect(Optional.ofNullable(10).flatMap(val => f(val)).flatMap(val => g(val)).get())
        .toBe(Optional.ofNullable(10).flatMap(val => g(val)).flatMap(val => f(val)).get())

    // Monad left identity law
    expect(Optional.ofNullable("foobar").get()).toBe(
        Optional.ofNullable("foo").flatMap(s => Optional.ofNullable(s + "bar")).get())
    // Monad right identity law
    expect(Optional.ofNullable("foo").flatMap(s => Optional.ofNullable(s)).get())
        .toBe(Optional.ofNullable("foo").get())

    // Monad associativity law
    expect(Optional.ofNullable("foo").flatMap(foo => Optional.ofNullable(foo + "bar")).flatMap(foobar => Optional.ofNullable(foobar + "baz")).get())
        .toBe(Optional.ofNullable("foo").flatMap(foo => Optional.ofNullable(foo + "bar").flatMap(foobar => Optional.ofNullable(foobar + "baz"))).get())

  })

  it('Optional.mapIf', () => {
    expect(Optional.of("foo")
        .mapIf(s => s === "foo", s => s)
        .get()).toBe("foo")

    expect(Optional.of("foo")
        .mapIf(s => s === "a", s => s+"b")
        .orMapIf(s => s === "foo", s => s+"bar")
        .get()).toBe("foobar")

    expect(Optional.ofNullable("foo")
        .mapIf(s => s === "x", s => "y")
        .orMapIf(s => s === "foo", s => "bar")
        .get()).toBe("bar")

    expect(Optional.ofNullable("foo")
        .mapIf(s => s === "x", s => s+"bar").get())
        .toBe("foo")

    expect(Optional.empty()
        .mapIf(s => s === "foo", s => s+"bar")
        .orMapIf(s => s === "x", s => "y")
        .isPresent()).toBe(false)

    expect(Optional.ofNullable(null).mapIf(s => s === "foo", s => s+"bar").isPresent()).toBe(false)

    expect(Optional.of("a").and("b").and("c")
        .mapIf(([a,b,c]) => a === "a", ([a,b,c]) => a+"x")
        .orMapIf(([a,b,c]) => a === "b", ([a,b,c]) => a+"y")
        .orMapIf(([a,b,c]) => b === "b", ([a,b,c]) => a+"y")
        .get()).toBe("ax")

    expect(Optional.of("a")
        .mapIf(a => a === "a", a => "b")
        .orMapIf(a => a === "b", a => a+"b")
        .mapIf(b => b === "b", b => "c")
        .get()).toBe("c")

    expect(Optional.of("a").and(null).and("c")
        .mapIf(([a,b,c]) => a === "a", ([a,b,c]) => a+"x")
        .isPresent()).toBe(false)
  })

  it('Optional.flatMapIf', () => {
    expect(Optional.of("foo")
        .flatMapIf(s => s === "foo", s => Optional.of(s))
        .orFlatMapIf(s => s === "x", s => Optional.of("y"))
        .get()).toBe("foo")

    expect(Optional.of("foo")
        .flatMapIf(s => s === "x", s => Optional.of("y"))
        .orFlatMapIf(s => s === "foo", s => Optional.of(s+"bar"))
        .get()).toBe("foobar")

    expect(Optional.ofNullable("foo")
        .flatMapIf(s => s === "foo", s => Optional.of("bar"))
        .orFlatMapIf(s => s === "foo", s => Optional.of(s+"bar"))
        .get()).toBe("bar")

    expect(Optional.ofNullable("foo")
        .flatMapIf(s => s === "x", s => Optional.of(s+"bar"))
        .orFlatMapIf(s => s === "y", s => Optional.of(s+"bar"))
        .get()).toBe("foo")

    expect(Optional.empty()
        .flatMapIf(s => s === "foo", s => Optional.of(s+"bar"))
        .orFlatMapIf(s => s === "y", s => Optional.of(s+"bar"))
        .isPresent()).toBe(false)

    expect(Optional.ofNullable(null)
        .flatMapIf(s => s === "foo", s => Optional.of(s+"bar"))
        .orFlatMapIf(s => s === "y", s => Optional.of(s+"bar"))
        .isPresent()).toBe(false)

    expect(Optional.of("a").and("b").and("c")
        .flatMapIf(([a,b,c]) => a === "a", ([a,b,c]) => Optional.of(a+"x"))
        .orFlatMapIf(([a,b,c]) => a === "b", ([a,b,c]) => Optional.of(a+"y"))
        .orFlatMapIf(([a,b,c]) => b === "b", ([a,b,c]) => Optional.of(a+"y"))
        .get()).toBe("ax")

    expect(Optional.of("a")
        .flatMapIf(a => a === "a", a => Optional.of("b"))
        .orFlatMapIf(a => a === "b", a => Optional.of(a+"b"))
        .flatMapIf(b => b === "b", b => Optional.of("c"))
        .get()).toBe("c")

    expect(Optional.of("a").and(null).and("c")
        .flatMapIf(([a,b,c]) => a === "a", ([a,b,c]) => Optional.of(a+"x"))
        .orFlatMapIf(([a,b,c]) => a === "b", ([a,b,c]) => Optional.of(a+"y"))
        .isPresent()).toBe(false)
  })

  it('Optional.orElseMap', () => {
    expect(Optional.of("foo").orElseMap(() => "bar").get()).toBe("foo")
    expect(Optional.EMPTY.orElseMap(() => "foo").get()).toBe("foo")
    expect(Optional.EMPTY.map(s => "bar").orElseMap(() => "foo").get()).toBe("foo")
  })

  it('Optional.orElseFlatMap', () => {
    expect(Optional.of("foo").orElseFlatMap(() => Optional.of("bar")).get()).toBe("foo")
    expect(Optional.EMPTY.orElseFlatMap(() => Optional.of("foo")).get()).toBe("foo")
    expect(Optional.EMPTY.orElseFlatMap(() => Optional.EMPTY).isEmpty()).toBe(true)
    expect(Optional.EMPTY.orElseFlatMap(() => Optional.of("foo")).get()).toBe("foo")
  })

  it('Optional.orElse', () => {
    expect(Optional.ofNullable("foo").orElse("bar")).toBe("foo")
    expect(Optional.EMPTY.orElse("foo")).toBe("foo")
  })

  it('Optional.orElseGet', () => {
    expect(Optional.ofNullable("foo").orElseGet(() => "bar")).toBe("foo")
    expect(Optional.EMPTY.orElseGet(() => "foo")).toBe("foo")
  })

  it('Optional.orElseThrow', () => {
    expect(Optional.ofNullable("foo").orElseThrow(() => {throw new Error("Test")})).toBe("foo")
    expect(() => Optional.EMPTY.orElseThrow(() => {throw new Error("Test")})).toThrow()
  })

  it('Optional.orUse', () => {
    expect(Optional.ofNullable(null).orUse("a").get()).toBe("a")

    expect(Optional.of("a").orUse("b").map(s => s).get()).toBe("a")
    expect(Optional.of("a").and("b").orUse("c").map(([a,b]) => a+b).get()).toBe("ab")

    expect(Optional.ofNullable("foo").orUse("b").map(s => s+"bar").get()).toBe("foobar")

    expect(Optional.ofNullable(null).orUse("foo").map(s => s+"bar").isPresent()).toBe(true)
    expect(Optional.ofNullable(null).and("b").orUse("foo").map(s => s+"bar").isPresent()).toBe(true)

    expect(Optional.ofNullable(null).orElseMap(() => "foo")
        .orUse("a").map(s => s+"bar").get()).toBe("foobar")

    expect(Optional.ofNullable("a").map(a => "b")
        .orElseMap(() => "foo").flatMap(b => Optional.of("foo"))
        .orUse("a").map(s => s+"bar").get()).toBe("foobar")
  })

  it('Optional.pair', () => {
    expect(Optional.of("foo").pairWith("x").isPresent()).toBe(true)
    expect(Optional.of("foo").pairWith(null).isEmpty()).toBe(false)

    expect(Optional.of("a").and("b").pairWith("x").isPresent()).toBe(true)
    expect(Optional.of("a").and("b").pairWith(null).isEmpty()).toBe(false)
    expect(Optional.of("a").and(null).pairWith("x").isEmpty()).toBe(true)
    expect(Optional.of("a").and(null).pairWith(null).isEmpty()).toBe(true)

    expect(Optional.EMPTY.pairWith("x").isEmpty()).toBe(true)
    expect(Optional.ofNullable(null).pairWith("x").isEmpty()).toBe(true)
    expect(Optional.ofNullable(null).pairWith(null).isEmpty()).toBe(true)

    expect(Optional.ofNullable(null).pairWith("x")
        .orUse("a").get()).toBe("a")
    Optional.ofNullable(null).pairWith("x").ifEmpty(x => {
        expect(x).toBe("x")
    })
    Optional.ofNullable(null).pairWith("x").orUse("a")
        .map((a,x) => {
          expect(a).toBe("a")
          expect(x).toBe("x")
        })
    Optional.ofNullable(null).pairWith("x").orUse("a")
        .ifPresent((a,x) => {
          expect(a).toBe("a")
          expect(x).toBe("x")
        })

    expect(Optional.of("a").orUse("b").pairWith("x").map(s => s).get()).toBe("a")
    Optional.of("a").orUse("b").pairWith("x")
        .map((a,x) => {
          expect(a).toBe("a")
          expect(x).toBe("x")
        })

    expect(Optional.ofNullable("foo").orUse("b").pairWith("x")
        .map(s => s+"bar").get()).toBe("foobar")

    expect(Optional.ofNullable(null).pairWith("x").orUse("foo").map(s => s+"bar").isPresent()).toBe(true)
    expect(Optional.ofNullable(null).orElseMap(() => "foo")
        .orUse("a").pairWith("x").map(s => s+"bar").get()).toBe("foobar")
    Optional.ofNullable(null).orElseMap(() => "a")
        .orUse("b").pairWith("x")
        .map((a,x) => {
          expect(a).toBe("a")
          expect(x).toBe("x")
        })

    expect(Optional.of("a").and("b").pairWith("c")
        .map(([a,b],c) => a+b+c).get()).toBe("abc")
    expect(Optional.of("a").and("b").and("c").pairWith("d")
        .map(([a,b,c],d) => a+b+c).get()).toBe("abc")
    expect(Optional.of("a").and("b").and("c").pairWith(null)
        .map(([a,b,c]) => a+b+c).get()).toBe("abc")
    expect(Optional.of("a").and("b").and("c").pairWith("d")
        .map(([a,b,c],d) => a+b+c+d).get()).toBe("abcd")
    expect(Optional.of("a").and("b").and("c").pairWith(null)
        .map(([a,b,c],d) => a+b+c+d).get()).toBe("abcnull")
  })


  it('Optional ifOnlyLeft, ifOnlyRight, ifBoth', () => {
    const fn = jest.fn()
    Optional.empty().pairWith("b").ifOnlyLeft(a => fn())
    expect(fn).toHaveBeenCalledTimes(0)

    Optional.empty().joinMap(v => Optional.of("a")).pairWith("b").ifOnlyLeft(a => fn())
    expect(fn).toHaveBeenCalledTimes(0)

    Optional.empty().pairWith(null).ifOnlyRight(b => fn())
    expect(fn).toHaveBeenCalledTimes(0)

    Optional.empty().pairWith("b").ifOnlyRight(b => fn())
    expect(fn).toHaveBeenCalledTimes(1)

    expect(Optional.of("a").pairWith("b")
        .ifOnlyLeft(a => {throw new Error("Test")})
        .get()).toBe("a")

    expect(Optional.of("a").and("b").pairWith("c")
        .ifOnlyLeft(a => {throw new Error("Test")})
        .map(([a,b]) => "x")
        .get()).toBe("x")

    let callback = jest.fn()
    expect(Optional.of("a").pairWith(null)
        .ifOnlyLeft(a => callback())
        .get()).toBe("a")
    expect(callback).toHaveBeenCalledTimes(1)

    callback = jest.fn()
    expect(Optional.of("a").and("b").pairWith(null)
        .ifOnlyLeft(a => callback())
        .map(([a,b]) => "x")
        .get()).toBe("x")
    expect(callback).toHaveBeenCalledTimes(1)

    expect(Optional.of("a").pairWith("b")
        .ifOnlyRight(b => {throw new Error("Test")})
        .get()).toBe("a")

    callback = jest.fn()
    expect(Optional.ofNullable(null).pairWith("b")
        .ifOnlyRight(b => callback())
        .orElse("a")).toBe("a")
    expect(callback).toHaveBeenCalledTimes(1)

    callback = jest.fn()
    expect(Optional.ofNullable("a").and("b").pairWith("c")
        .ifOnlyRight(b => callback())
        .map(([a,b]) => "x")
        .get()).toBe("x")
    expect(callback).toHaveBeenCalledTimes(0)

    callback = jest.fn()
    expect(Optional.ofNullable(null).and("b").pairWith("c")
        .ifOnlyRight(b => callback())
        .orElse("a")).toBe("a")
    expect(callback).toHaveBeenCalledTimes(1)

    Optional.of("a").pairWith("b")
        .ifBoth((a,b) => {
          expect(a).toBe("a")
          expect(b).toBe("b")
        })

    callback = jest.fn()
    Optional.of("a").ifBoth((a,b) => fn())
    expect(callback).toHaveBeenCalledTimes(0)
    Optional.of("a").pairWith(null).ifBoth((a,b) => fn())
    expect(callback).toHaveBeenCalledTimes(0)
    Optional.of("a").and("b").ifBoth((a,b) => fn())
    expect(callback).toHaveBeenCalledTimes(0)

    Optional.of("a").and("b").pairWith("c")
        .ifBoth(([a,b],c) => {
          expect(a).toBe("a")
          expect(b).toBe("b")
          expect(c).toBe("c")
        })

    callback = jest.fn()
    expect(Optional.ofNullable(null).pairWith("b")
        .ifBoth((a,b) => callback())
        .orElse("a")).toBe("a")
    expect(callback).toHaveBeenCalledTimes(0)

    callback = jest.fn()
    expect(Optional.ofNullable(null).and("b").pairWith("c")
        .ifBoth((a,b) => callback())
        .orElse("a")).toBe("a")
    expect(callback).toHaveBeenCalledTimes(0)

  })

  it('Optional.rewind', () => {
    expect(Optional.of("foo").map(s => s+"bar").rewind().get()).toBe("foo")
    expect(Optional.ofNullable("foo").map(s => s).rewind().get()).toBe("foo")
    expect(Optional.ofNullable("foo").map(s => "abc").rewind().map(s => s+"bar").get()).toBe("foobar")
    expect(Optional.of("foo").map(s => null).rewind().get()).toBe("foo")
    expect(Optional.of("foo").and(null).rewind().isPresent()).toBe(true)
    expect(Optional.ofNullable(null).map(s => s+"bar").rewind().isPresent()).toBe(false)

    expect(Optional.of("foo").flatMap(s => Optional.ofNullable(null)).rewind().isPresent()).toBe(true)
    expect(Optional.of("foo").flatMap(s => Optional.of(s+"bar")).rewind().get()).toBe("foo")
    expect(Optional.ofNullable("foo").rewind().flatMap(s => Optional.of(s)).get()).toBe("foo")
    expect(Optional.ofNullable("foo").rewind().flatMap(s => Optional.of(s+"bar")).get()).toBe("foobar")
    expect(Optional.of("foo").and(null).flatMap(s => Optional.of(s+"bar")).rewind().get()).toBe("foo")
    expect(Optional.ofNullable(null).flatMap(s => Optional.of(s+"bar")).rewind().isPresent()).toBe(false)

    expect(Optional.ofNullable("a").and("b").and("c").rewind().get()).toBe("a")
    expect(Optional.ofNullable("a").and("b").rewind().and("c").rewind().and("d").rewind().get()).toBe("a")
    expect(Optional.ofNullable("a").and(null).and("c").rewind().get()).toBe("a")
    expect(Optional.ofNullable("a").and(null).rewind().and("c").rewind().get()).toBe("a")

  })

  it('Multi Optional - Basic', () => {
    const optionalABC = Optional.ofNullable("a").and("b").and("c")

    optionalABC.ifPresent(([a,b,c]) => {
      expect(a).toBe("a")
      expect(b).toBe("b")
      expect(c).toBe("c")
    })

    expect(optionalABC.isPresent()).toBe(true)

    const callback = jest.fn()
    const optionalNull1 = Optional.ofNullable(null).and("b").and("c")
    expect(optionalNull1.isEmpty()).toBe(true)
    optionalNull1.ifPresent(val => {throw new Error("A null in MultiPresent should not be present")})
    optionalNull1.ifEmpty(() => callback())
    expect(callback).toHaveBeenCalledTimes(1)

    const optionalNull2 = Optional.ofNullable("a").and(null).and("c")
    expect(optionalNull2.isEmpty()).toBe(true)
    optionalNull2.ifPresent(val => {throw new Error("A null in MultiPresent should not be present")})
    optionalNull2.ifEmpty(() => callback())
    expect(callback).toHaveBeenCalledTimes(2)

    const optionalUndefined = Optional.ofNullable("a").and("b").and(undefined)
    expect(optionalUndefined.isEmpty()).toBe(true)
    optionalUndefined.ifPresent(val => {throw new Error("An undefined in MultiPresent should not be present")})
    optionalUndefined.ifEmpty(() => callback())
    expect(callback).toHaveBeenCalledTimes(3)

    expect(Optional.of("a").or("b").or("c").get()).toBe("a")
    expect(Optional.of("foo").or("b").or("c").map(s => s+"bar").get()).toBe("foobar")
    expect(Optional.of("foo").or("b").or("c").map(s => s+"bar").rewind().get()).toBe("foo")
    expect(Optional.ofNullable(null).or("a").or("b").get()).toBe("a")
    expect(Optional.ofNullable("a").map(s => "foo").or("b").or("c").map(s => s+"bar").get()).toBe("foobar")
    expect(Optional.of("foo").or(null).or("c").map(s => null).rewind().get()).toBe("foo")

    Optional.of("a").and("b").or("c")
        .join(([a,b]) => a+b)
        .ifPresent(([a,b,ab]) => expect(ab).toBe("ab"))

    expect(Optional.of("a").and("b").or("c")
        .join((a,b) => null)
        .isPresent()).toBe(false)

    expect(Optional.of("a").and("b").join((a,b) => a+b).toArray().length).toBe(3)

    Optional.of("a").and("b").or("c")
        .ifPresent(([a,b]) => expect(a).toBe("a"))
        .ifPresent(([a,b]) => expect(a).toBe("a"))
        .map(([a,b]) => a+b)
        .ifPresent(ab => expect(ab).toBe("ab"))


    expect(Optional.of("a")
        .flatMap(a => Optional.of(a).and("b").and("c")
            .map(([a,b,c]) => a+b+c)).get()).toBe("abc")
  })

  it('Optional Multi - filter', () => {
    const optionalABC = Optional.ofNullable("a").and("b").and("c")

    expect(optionalABC.filter(([a,b,c]) => a === "a" && b === "b" && c === "c").get()).toHaveLength(3)

    expect(optionalABC.filter(([a,b,c]) => a === "x").isEmpty()).toBe(true)

    expect(optionalABC.filterEach(i => i === "a" || i === "b" || i === "c")
        .ifPresent(([a,b,c]) => {
          expect(a).toBe("a")
          expect(b).toBe("b")
          expect(c).toBe("c")
        }))

    expect(optionalABC.filterEach(i => i === "a" || i === "b").get()).toHaveLength(2)
    expect(optionalABC.filterEach(i => i === "x").isEmpty()).toBe(true)
    expect(optionalABC.filterEach(i => i === "a" || i === "b")
        .ifPresent(([a,b,c]) => {
          expect(a).toBe("a")
          expect(b).toBe("b")
          expect(c).toBe(undefined)
        }))
  })

  it('Optional Multi - map', () => {
    const fn = ([a,b,c]) => {
      expect(a).toBe("a")
      expect(b).toBe("b")
      expect(c).toBe("c")
    }
    const optionalABC = Optional.ofNullable("a").and("b").and("c")

    optionalABC.map(fn)

    optionalABC
        .mapIf(([a,b,c]) => a === "x", ([a,b,c]) => ["d","e"])
        .orMapIf(([a,b,c]) => a === "a", ([a,b,c]) => ["x","y"])
        .mapIf(([x,y]) => x === "x", ([x,y]) => ["a","b","c"])
        .ifPresent(fn)

    optionalABC
        .mapIf(([a,b,c]) => a === "x", ([a,b,c]) => ["d","e"])
        .orMapIf(([a,b,c]) => a === "y", ([a,b,c]) => ["x","y"])
        .mapIf(([x,y]) => x === "x", ([x,y]) => ["a","b","c"])
        .ifPresent(fn)

    optionalABC
        .flatMapIf(([a,b,c]) => a === "x", ([a,b,c]) => Optional.of("d").and("e"))
        .orFlatMapIf(([a,b,c]) => a === "a", ([a,b,c]) => Optional.of("x").and("y"))
        .mapIf(([x,y]) => x === "x", ([x,y]) => ["a","b","c"])
        .ifPresent(fn)

    optionalABC
        .flatMapIf(([a,b,c]) => a === "x", ([a,b,c]) => Optional.of("d").and("e"))
        .orFlatMapIf(([a,b,c]) => a === "y", ([a,b,c]) => Optional.of("x").and("y"))
        .mapIf(([x,y]) => x === "x", ([x,y]) => ["a","b","c"])
        .ifPresent(fn)

    optionalABC.map(([a,b,c]) => a+b+c)
        .ifPresent(abc => expect(abc).toBe("abc"))

    optionalABC.map(([a,b,c]) => [a,b,c]).ifPresent(([a,b,c]) => {
      expect(a).toBe("a")
      expect(b).toBe("b")
      expect(c).toBe("c")
    })

    const optionalNull1 = Optional.ofNullable(null).and("b").and("c")
    expect(optionalNull1.map(s => s+"bar").isPresent()).toBe(false)

    const f = val => val + val
    const g = val => val + val + val
    expect(optionalABC.map(val => f(val)).map(val => g(val)).get())
        .toBe(optionalABC.map(val => g(val)).map(val => f(val)).get())
  })

  it('Optional Multi - flatMap', () => {
    const optionalABC = Optional.ofNullable("a").and("b").and("c")

    optionalABC.flatMap(([a,b,c]) => {
      expect(a).toBe("a")
      expect(b).toBe("b")
      expect(c).toBe("c")
      return optionalABC
    })
    optionalABC.flatMap(([a,b,c]) => Optional.of(a+b+c))
        .ifPresent(abc => expect(abc).toBe("abc"))

    const optionalNull1 = Optional.ofNullable(null).and("b").and("c")
    expect(optionalNull1.flatMap(s => Optional.of(s+"bar")).isPresent()).toBe(false)

    const f = val => Optional.of(val + val)
    const g = val => Optional.of(val + val + val)
    expect(optionalABC.flatMap(val => f(val)).flatMap(val => g(val)).get())
        .toBe(optionalABC.flatMap(val => g(val)).flatMap(val => f(val)).get())
  })


  it('Optional Multi - orElse...', () => {
    const optionalABC = Optional.ofNullable("a").and("b").and("c")
    const optionalNull1 = Optional.ofNullable(null).and("b").and("c")

    expect(optionalABC.orElseMap(() => "bar").get()).toHaveLength(3)
    expect(optionalNull1.map(s => "bar").orElseMap(() => "foo").get()).toBe("foo")

    expect(optionalABC.orElseFlatMap(() => Optional.of("bar")).get()).toHaveLength(3)
    expect(optionalNull1.orElseFlatMap(() => Optional.of("foo")).get()).toBe("foo")

    expect(optionalABC.orElse("bar")).toHaveLength(3)
    expect(optionalNull1.orElse("foo")).toBe("foo")

    expect(optionalABC.orElseGet(() => "bar")).toHaveLength(3)
    expect(optionalNull1.orElseGet(() => "foo")).toBe("foo")

    expect(optionalABC.orElseThrow(() => {throw new Error("Test")})).toHaveLength(3)
    expect(() => optionalNull1.orElseThrow(() => {throw new Error("Test")})).toThrow()
  })

  it('Optional Multi - Join', () => {
    const optionalABC = Optional.ofNullable("a")
        .joinMap(a => Optional.ofNullable("b"))
        .joinMap(b => Optional.ofNullable("c"))

    optionalABC.ifPresent(([a,b,c]) => {
      expect(a).toBe("a")
      expect(b).toBe("b")
      expect(c).toBe("c")
    })

    optionalABC.flatMap(([a,b,c]) => {
      expect(a).toBe("a")
      expect(b).toBe("b")
      expect(c).toBe("c")
      return optionalABC
    })
    optionalABC.flatMap(([a,b,c]) => Optional.of(a+b+c))
        .ifPresent(abc => expect(abc).toBe("abc"))

    const optionalABC2 = Optional.ofNullable("a")
        .join(a => "b")
        .join(b => "c")

    optionalABC2.ifPresent(([a,b,c]) => {
      expect(a).toBe("a")
      expect(b).toBe("b")
      expect(c).toBe("c")
    })

    optionalABC2.flatMap(([a,b,c]) => {
      expect(a).toBe("a")
      expect(b).toBe("b")
      expect(c).toBe("c")
      return optionalABC2
    })
    optionalABC2.flatMap(([a,b,c]) => Optional.of(a+b+c))
        .ifPresent(abc => expect(abc).toBe("abc"))

    optionalABC2.ifPresent(([a,b,c]) => {
      expect(a).toBe("a")
      expect(b).toBe("b")
      expect(c).toBe("c")
    })

    Optional.ofNullable("a").and("b").join(([a,b]) => a+b)
        .ifPresent(([a,b,ab]) => expect(ab).toBe("ab"))

    Optional.ofNullable("a").and("b").pairWith("c").join(([a,b],c) => a+b+c)
        .ifPresent(([a,b,abc],c) => expect(abc).toBe("abc"))

    const optionalNull1 = Optional.ofNullable("a")
        .join(a => null)
        .join(b => "c")

    const callback = jest.fn()
    expect(optionalNull1.isEmpty()).toBe(true)
    optionalNull1.ifPresent(val => {throw new Error("A null in MultiPresent should not be present")})
    optionalNull1.ifEmpty(() => callback())
    expect(callback).toHaveBeenCalledTimes(1)
    expect(optionalNull1.flatMap(s => Optional.of(s+"bar")).isPresent()).toBe(false)

    const optionalNull2 = Optional.ofNullable("a")
        .join(a => "b")
        .joinMap(b => Optional.ofNullable(null))

    const callback2 = jest.fn()
    expect(optionalNull2.isEmpty()).toBe(true)
    optionalNull2.ifPresent(val => {throw new Error("A null in MultiPresent should not be present")})
    optionalNull2.ifEmpty(() => callback2())
    expect(callback2).toHaveBeenCalledTimes(1)
    expect(optionalNull2.flatMap(s => Optional.of(s+"bar")).isPresent()).toBe(false)
  })

  it('Optional Multi - For', () => {
    const optionalABC = Optional.for(
        Optional.ofNullable("a"),
        Optional.ofNullable("b"),
        Optional.ofNullable("c"))

    optionalABC.ifPresent(([a,b,c]) => {
      expect(a).toBe("a")
      expect(b).toBe("b")
      expect(c).toBe("c")
    })

    optionalABC.flatMap(([a,b,c]) => {
      expect(a).toBe("a")
      expect(b).toBe("b")
      expect(c).toBe("c")
      return optionalABC
    })
    optionalABC.flatMap(([a,b,c]) => Optional.of(a+b+c))
        .ifPresent(abc => expect(abc).toBe("abc"))

    const optionalNull1 = Optional.for(
        Optional.ofNullable("a"),
        Optional.ofNullable(null),
        Optional.ofNullable("c"))

    expect(Optional.for().isEmpty()).toBe(true)
    expect(Optional.for(null).isEmpty()).toBe(true)

    const callback = jest.fn()
    expect(optionalNull1.isEmpty()).toBe(true)
    optionalNull1.ifPresent(val => {throw new Error("A null in MultiPresent should not be present")})
    optionalNull1.ifEmpty(() => callback())
    expect(callback).toHaveBeenCalledTimes(1)
    expect(optionalNull1.flatMap(s => Optional.of(s+"bar")).isPresent()).toBe(false)
  })

  it('Optional Multi - From', () => {
    const optionalABC = Optional.from("a", "b", "c")

    optionalABC.ifPresent(([a,b,c]) => {
      expect(a).toBe("a")
      expect(b).toBe("b")
      expect(c).toBe("c")
    })

    optionalABC.flatMap(([a,b,c]) => {
      expect(a).toBe("a")
      expect(b).toBe("b")
      expect(c).toBe("c")
      return optionalABC
    })
    optionalABC.flatMap(([a,b,c]) => Optional.of(a+b+c))
        .ifPresent(abc => expect(abc).toBe("abc"))

    expect(Optional.from().isEmpty()).toBe(true)
    expect(Optional.from(null).isEmpty()).toBe(true)

    const optionalNull1 = Optional.from("a", null, "c")

    const callback = jest.fn()
    expect(optionalNull1.isEmpty()).toBe(true)
    optionalNull1.ifPresent(val => {throw new Error("A null in MultiPresent should not be present")})
    optionalNull1.ifEmpty(() => callback())
    expect(callback).toHaveBeenCalledTimes(1)
    expect(optionalNull1.flatMap(s => Optional.of(s+"bar")).isPresent()).toBe(false)

    expect(() => MultiPresent.fromArray(null)).toThrow()
    expect(() => MultiPresent.fromTwoValues(null, null)).toThrow()
  })

  it('Optional - dropFirst, dropLast', () => {
    const fn = ([a,b]) => {
      expect(a).toBe("a")
      expect(b).toBe("b")
    }

    Optional.ofNullable(null)
    expect(Optional.ofNullable(null).dropFirst().isEmpty()).toBe(true)
    expect(Optional.ofNullable(null).dropLast().isEmpty()).toBe(true)

    expect(Optional.ofNullable("x").dropFirst().isEmpty()).toBe(true)
    expect(Optional.ofNullable("x").dropLast().isEmpty()).toBe(true)

    expect(Optional.ofNullable("x").dropFirst(0).isEmpty()).toBe(false)
    expect(Optional.ofNullable("x").dropFirst(-1).isEmpty()).toBe(false)
    expect(Optional.ofNullable("x").dropLast(0).isEmpty()).toBe(false)
    expect(Optional.ofNullable("x").dropLast(-1).isEmpty()).toBe(false)

    Optional.ofNullable("x").and("a").and("b")
        .dropFirst().ifPresent(fn)

    Optional.ofNullable("x").and("a").and("b").and("y")
        .dropFirst().dropLast().ifPresent(fn)

    Optional.ofNullable("x").and("y").and("z").and("a").and("b")
        .dropFirst(3).ifPresent(fn)

    Optional.ofNullable("a").and("b").and("x").and("y").and("z")
        .dropLast(3).ifPresent(fn)

    expect(Optional.ofNullable("a").and("b").and("x").and("y").and("z")
        .dropFirst(1).get().length).toBe(4)
    expect(Optional.ofNullable("a").and("b").and("x").and("y").and("z")
        .dropLast(1).get().length).toBe(4)
    expect(Optional.ofNullable("a").and("b").and("x").and("y").and("z")
        .dropFirst(3).get().length).toBe(2)
    expect(Optional.ofNullable("a").and("b").and("x").and("y").and("z")
        .dropLast(3).get().length).toBe(2)
    expect(Optional.ofNullable("a").and("b").and("x").and("y").and("z")
        .dropFirst(6).get().length).toBe(5)
    expect(Optional.ofNullable("a").and("b").and("x").and("y").and("z")
        .dropLast(6).get().length).toBe(5)
  })

  it('Optional.rebase', () => {
    expect(Optional.ofNullable("a").map(a => "b")
        .rebase()
        .map(b => "c").rewind().map(b => "d").rewind().get()).toBe("b")

    let callback = jest.fn()
    expect(Optional.ofNullable("a").map(a => null)
        .ifPresent(() => callback())
        .ifEmpty(() => callback())
        .rebase()
        .map(b => "c").rewind().map(b => "d")
        .ifEmpty(() => callback())
        .orElse("x")).toBe("x")
    expect(callback).toHaveBeenCalledTimes(1)

    callback = jest.fn()
    Optional.ofNullable(null)
        .ifPresent(() => callback())
        .ifEmpty(() => callback())
        .rebase()
        .and("b").and("c")
        .ifPresent(() => callback())
        .ifEmpty(() => callback())
    expect(callback).toHaveBeenCalledTimes(1)

    callback = jest.fn()
    Optional.ofNullable("a")
        .ifPresent(() => callback())
        .ifEmpty(() => callback())
        .rebase()
        .and("b").and("c")
        .ifPresent(() => callback())
        .ifEmpty(() => callback())
    expect(callback).toHaveBeenCalledTimes(2)

    callback = jest.fn()
    expect(Optional.ofNullable("a").map(a => "b")
        .ifPresent(() => callback())
        .ifEmpty(() => callback())
        .rebase()
        .map(b => "c").map(c => "d")
        .orElse("x")).toBe("d")
    expect(callback).toHaveBeenCalledTimes(1)

    callback = jest.fn()
    expect(Optional.ofNullable("a").map(a => "b")
        .rebase()
        .ifPresent(() => callback())
        .ifEmpty(() => callback())
        .map(b => "c").map(c => "d")
        .orElse("x")).toBe("d")
    expect(callback).toHaveBeenCalledTimes(1)

    callback = jest.fn()
    expect(Optional.ofNullable("a").map(a => null)
        .rebase()
        .ifPresent(() => callback())
        .ifEmpty(() => callback())
        .map(b => "c").map(c => "d")
        .orElse("x")).toBe("x")
    expect(callback).toHaveBeenCalledTimes(0)

    callback = jest.fn()
    expect(Optional.ofNullable("a").map(a => null)
        .rebase()
        .map(b => "c")
        .orElseMap(() => "d")
        .ifPresent(() => callback())
        .ifEmpty(() => callback())
        .orElse("x")).toBe("x")
    expect(callback).toHaveBeenCalledTimes(0)

    callback = jest.fn()
    expect(Optional.ofNullable("a").map(a => "b")
        .rebase()
        .map(b => "c")
        .orElseMap(() => "d")
        .ifPresent(() => callback())
        .ifEmpty(() => callback())
        .orElse("x")).toBe("c")
    expect(callback).toHaveBeenCalledTimes(1)

    callback = jest.fn()
    expect(Optional.ofNullable("a").map(a => null)
        .rebase()
        .map(b => "c")
        .orElseFlatMap(() => Optional.of("d"))
        .ifPresent(() => callback())
        .ifEmpty(() => callback())
        .orElse("x")).toBe("x")
    expect(callback).toHaveBeenCalledTimes(0)

    callback = jest.fn()
    expect(Optional.ofNullable("a").map(a => "b")
        .rebase()
        .map(b => "c")
        .orElseFlatMap(() => Optional.of("d"))
        .ifPresent(() => callback())
        .ifEmpty(() => callback())
        .orElse("x")).toBe("c")
    expect(callback).toHaveBeenCalledTimes(1)

    callback = jest.fn()
    expect(Optional.ofNullable("a").map(a => null)
        .rebase()
        .or("c")
        .orElseMap(() => "d")
        .ifPresent(() => callback())
        .ifEmpty(() => callback())
        .orElse("x")).toBe("x")
    expect(callback).toHaveBeenCalledTimes(0)

    callback = jest.fn()
    expect(Optional.ofNullable(null).or("b")
        .rebase()
        .or("c")
        .orElseMap(() => "d")
        .ifPresent(() => callback())
        .ifEmpty(() => callback())
        .orElse("x")).toBe("b")
    expect(callback).toHaveBeenCalledTimes(1)

    callback = jest.fn()
    expect(Optional.ofNullable(null).or("b")
        .rebase()
        .and("c")
        .orElseMap(() => "d")
        .ifPresent(() => callback())
        .ifEmpty(() => callback())
        .rewind()
        .and(null)
        .orElseMap(() => "d")
        .ifPresent(() => callback())
        .ifEmpty(() => callback())
        .orElse("x")).toBe("d")
    expect(callback).toHaveBeenCalledTimes(2)

  })

  it('Optional.toArray', () => {
    expect(Optional.empty().toArray().length).toBe(0)

    expect(Optional.of("a").toArray().length).toBe(1)
    expect(Optional.of("a").toArray()[0]).toBe("a")

    expect(Optional.of(["a","b"]).toArray().length).toBe(2)
    expect(Optional.of(["a","b"]).toArray()[0]).toBe("a")
    expect(Optional.of(["a","b"]).toArray()[1]).toBe("b")

    expect(Optional.of("a").and("b").toArray().length).toBe(2)
    expect(Optional.of("a").and("b").toArray()[0]).toBe("a")
    expect(Optional.of("a").and("b").toArray()[1]).toBe("b")
  })

  it('Optional.clone', () => {
    expect(Optional.empty().clone().isEmpty()).toBe(true)
    expect(Optional.of("a").clone().get()).toBe("a")
    expect(Optional.of("a").and("b").clone().map(([a,b]) => a+b).get()).toBe("ab")
  })

})
