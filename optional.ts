export default class Optional<T> {
  static EMPTY: Optional<any>
  pair?: any
  original: Optional<T>
  rebased: boolean = false

  constructor() {
  }

  static empty<T>(original?: Optional<T>): Optional<T> {
    return new Empty(original)
  }

  static of<T> (value: T): Optional<T> {
    if (value === null || value === undefined) {
      throw new Error('Present cannot represent a missing value. Use ofNullable instead');
    }
    const p = new Present(value)
    p.original = p.clone()
    p.original.original = p.original
    return p
  }

  static ofNullable<T>(value?: T): Optional<T> {
    return (value === null || value === undefined) ? Optional.empty() : Optional.of(value)
  }

  static for<T>(...optionals: Array<Optional<T>>): Optional<Array<T>> {
    if (!optionals.length || optionals.length === 0) {
      return Optional.empty()
    }
    let present: boolean = true
    optionals.forEach(o => present = (present && o && o.isPresent()))
    if (present) {
      let values = []
      optionals.forEach(o => values.push(o.get()))
      return MultiPresent.fromArray(values)
    } else {
      return Optional.empty()
    }
  }

  static from<T>(...values: Array<T>): Optional<Array<T>> {
    if (!values || !values.length || values.length === 0) {
      return Optional.empty()
    }
    let present: boolean = true
    values.forEach(v => present = (present && v !== null && v !== undefined))
    if (present) {
      return MultiPresent.fromArray(values)
    } else {
      return Optional.empty()
    }
  }

  static if(value?: boolean): Optional<boolean> {
    return value ? new Present(true) : Optional.empty()
  }

  isPresent(): boolean {
    return false
  }

  isEmpty(): boolean {
    return true
  }

  get(): T {
    throw new Error('Empty.get called')
  }

  ifEmpty(runnable: (pair?: any) => any): Optional<T> {
    if (!this.rebased) {
      runnable(this.pair)
    }
    return this
  }

  ifPresent(consumer: (value: T, pair?: any) => any): Optional<any> {
    return this
  }

  orUse(other: T): Optional<T> {
    return Optional.ofNullable(other).pairWith(this.pair).setOriginal(this.original)
  }

  orElse(other: T): T {
    return other
  }

  orElseGet(supplier: (pair?: any) => T): T {
    return supplier(this.pair)
  }

  orElseThrow(exceptionSupplier: (pair?: any) => T): T {
    throw exceptionSupplier(this.pair)
  }

  filter(predicate: (value: T, pair?: any) => boolean): Optional<T> {
    return this
  }

  filterEach(predicate: (value: T, pair?: any) => boolean): Optional<T> {
    return this
  }

  map(mapper: (value: T, pair?: any) => any): Optional<any> {
    return this
  }

  flatMap(mapper: (value: T, pair?: any) => Optional<any>): Optional<any> {
    return this
  }

  orElseMap(mapper: (pair?: any) => T): Optional<T> {
    if (!this.rebased) {
      return Optional.ofNullable(mapper(this.pair)).pairWith(this.pair).setOriginal(this.original)
    }
    return this
  }

  orElseFlatMap(mapper: (pair?: any) => Optional<T>): Optional<T> {
    if (!this.rebased) {
      return mapper(this.pair).setOriginal(this.original)
    }
    return this
  }

  mapIf(predicate: (value: T, pair?: any) => boolean,
        mapper: (value: T, pair?: any) => any): Optional<any> {
    return this
  }

  orMapIf(predicate: (value: T, pair?: any) => boolean,
          mapper: (value: T, pair?: any) => any): Optional<any> {
    return this
  }

  flatMapIf(predicate: (value: T, pair?: any) => boolean,
            mapper: (value: T, pair?: any) => Optional<any>): Optional<any> {
    return this
  }

  orFlatMapIf(predicate: (value: T, pair?: any) => boolean,
                 mapper: (value: T, pair?: any) => Optional<any>): Optional<any> {
    return this
  }

  then(consumer: (value: any, pair?: any) => void): Optional<T> {
    consumer(undefined, this.pair)
    return this
  }

  and(value: T): Optional<any> {
    return this
  }

  or(value: T): Optional<T> {
    if (!this.rebased) {
      return Optional.ofNullable(value).setOriginal(this.original)
    }
    return this
  }

  pairWith(pair: any): Optional<T> {
    this.pair = pair
    return this
  }

  ifOnlyLeft(consumer: (value: T) => void): Optional<T> {
    return this
  }

  ifOnlyRight(consumer: (pair: any) => void): Optional<T> {
    if (this.pair) {
      consumer(this.pair)
    }
    return this
  }

  ifBoth(consumer: (value: T, pair: any) => void): Optional<T> {
    return this
  }

  join(mapper: (value: T, pair?: any) => any): Optional<any> {
    return this
  }

  joinMap(mapper: (value: T, pair?: any) => Optional<T>): Optional<any> {
    return this
  }

  dropFirst(howMany: number = 1): Optional<T> {
    return this
  }

  dropLast(howMany: number = 1): Optional<T> {
    return this
  }

  toArray(): Array<any> {
    return []
  }

  setOriginal(original: Optional<any>): Optional<T> {
    this.original = original
    return this
  }

  rewind(): Optional<T> {
    return this.original
  }
  /*
  * Rebase serves two purpose.
  * One, it allows you to mark a point in the functional chain after which the prior empty
  * values (before rebase) don't trigger the empty invocations (ifEmpty, or, orElseMap, orElse, etc).
  * Any new values that are added (e.g. via and, or, etc) will be checked for emptiness
  * and will trigger the empty invocations.
  * Second purpose served by rebase call is to mark a point in the functional chain to which you
  * can rewind back to in order to try multiple chains based off a set of functional steps that
  * were invoked prior to rebase. A call to rewind will bring the chain back to the rebase point,
  * as if any operations performed since rebase never happened. The provides a way to explore/traverse
  * multiple paths starting from the rebase point and keep coming back to it.
  */
  rebase(): Optional<T> {
    this.rebased = true
    this.original = this
    return this
  }

  clone(): Optional<T> {
    return new Empty()
  }
}

export class Empty<T> extends Optional <T> {
  constructor(original?: Optional<T>) {
    super()
    this.original = original ? original : this
  }
}

export class Present<T> extends Optional<T> {
  value: T
  isMapFilterOn: boolean = false

  constructor(value: T, pair?: any) {
    super()
    if (value === null || value === undefined) {
      throw new Error('Present cannot represent a missing value. Use Empty instead');
    }
    this.value = value
    this.pair = pair
  }

  isPresent(): boolean {
    return true
  }

  isEmpty(): boolean {
    return false
  }

  get(): T {
    return this.value
  }

  ifEmpty(runnable: (pair?: any) => any): Optional<T> {
    return this
  }

  ifPresent(consumer: (value: T, pair?: any) => any): Optional<T> {
    consumer(this.value, this.pair)
    return this
  }

  orUse(other: T): Optional<T> {
    return this
  }

  orElse(other: T): T {
    return this.value
  }

  orElseGet(supplier: () => T): T {
    return this.value
  }

  orElseThrow(exceptionSupplier: () => T): T {
    return this.value
  }

  filter(predicate: (value: T, pair?: any) => boolean): Optional<T> {
    return predicate(this.value, this.pair) ? this : new Empty<T>().setOriginal(this.original)
  }

  filterEach(predicate: (value: T, pair?: any) => boolean): Optional<T> {
    return this.filter(predicate)
  }

  map<U>(mapper: (value: T, pair?: any) => U): Optional<U> {
    return Optional.ofNullable(mapper(this.value, this.pair)).setOriginal(this.original)
  }

  flatMap<U>(mapper: (value: T, pair?: any) => Optional<U>): Optional<U> {
    const result = mapper(this.value, this.pair);
    return (result === null || result === undefined) ?
        new Empty<U>().setOriginal(this.original) : result.setOriginal(this.original);
  }

  orElseMap(mapper: () => T): Optional<T> {
    return this
  }

  orElseFlatMap(mapper: () => Optional<T>): Optional<T> {
    return this
  }

  mapIf<U>(predicate: (value: T, pair?: any) => boolean, mapper: (value: T, pair?: any) => U): Optional<T|U> {
    if (predicate(this.value, this.pair)) {
      return this.map(mapper)
    } else {
      this.isMapFilterOn = true
      return this
    }
  }

  orMapIf<U>(predicate: (value: T, pair?: any) => boolean, mapper: (value: T, pair?: any) => U): Optional<T|U> {
    return this.isMapFilterOn && predicate(this.value, this.pair) ? this.map(mapper) : this
  }

  flatMapIf<U>(predicate: (value: T, pair?: any) => boolean, mapper: (value: T, pair?: any) => Optional<U>): Optional<T|U> {
    if (predicate(this.value, this.pair)) {
      return this.flatMap(mapper)
    } else {
      this.isMapFilterOn = true
      return this
    }
  }

  orFlatMapIf<U>(predicate: (value: T, pair?: any) => boolean, mapper: (value: T, pair?: any) => Optional<U>): Optional<T|U> {
    return this.isMapFilterOn && predicate(this.value, this.pair) ? this.flatMap(mapper) : this
  }

  then(consumer: (value: T, pair?: any) => void): Optional<T> {
    consumer(this.value, this.pair)
    return this
  }

  and(value: any): Optional<any> {
    if (value === null || value === undefined) {
      return Optional.empty(this.original)
    }
    return MultiPresent.fromTwoValues(this.value, value).setOriginal(this.original)
  }

  or(value: T): Optional<T> {
    return this
  }

  pairWith(pair: any): Optional<T> {
    this.pair = pair
    return this
  }

  ifOnlyLeft(consumer: (value: T) => void): Optional<T> {
    if (!this.pair) {
      consumer(this.value)
    }
    return this
  }

  ifOnlyRight(consumer: (pair: any) => void): Optional<T> {
    return this
  }

  ifBoth(consumer: (value: T, pair: any) => void): Optional<T> {
    if (this.pair) {
      consumer(this.value, this.pair)
    }
    return this
  }

  join(mapper: (value: T, pair?: any) => any): Optional<any> {
    const result = mapper(this.value, this.pair);
    return result ? MultiPresent.fromTwoValues(this.value, result).setOriginal(this.original) : Optional.empty(this.original)
  }

  joinMap(mapper: (value: T, pair?: any) => Optional<T>): Optional<T> {
    const result = mapper(this.value, this.pair);
    return result.map(value => MultiPresent.fromTwoValues(this.value, value).setOriginal(this.original))
        .orElse(Optional.empty(this.original))
  }

  dropFirst(howMany: number = 1): Optional<T> {
    if (howMany > 0) {
      return Optional.empty()
    }
    return this
  }

  dropLast(howMany: number = 1): Optional<T> {
    if (howMany > 0) {
      return Optional.empty()
    }
    return this
  }

  toArray(): Array<any> {
    return this.value instanceof Array ? this.value : [this.value]
  }

  clone(): Present<T> {
    return new Present(this.value, this.pair)
  }
}

export class MultiPresent extends Optional <Array<any>> {
  values: Array<any> = []
  isMapFilterOn: boolean = false

  static fromTwoValues(val1: any, val2: any) : MultiPresent {
    if (val1 === null || val1 === undefined || val2 === null || val2 === undefined) {
      throw new Error('MultiPresent cannot represent a missing value. Use Empty instead');
    }
    const m = new MultiPresent()
    m.values.push(val1)
    m.values.push(val2)
    m.original = m.clone()
    m.original.original = m.original
    return m
  }

  static fromArray(values: Array<any>) : MultiPresent {
    if (values === null || values === undefined || values.length === 0) {
      throw new Error('MultiPresent cannot represent a missing value. Use Empty instead');
    }
    const m = new MultiPresent()
    m.values = values.slice();
    m.original = m.clone()
    return m
  }

  isPresent(): boolean {
    return true
  }

  isEmpty(): boolean {
    return false
  }

  get(): Array<any> {
    return this.values
  }

  ifEmpty(runnable: (pair?: any) => any) : MultiPresent {
    return this
  }

  ifPresent(consumer: (values: Array<any>, pair?: any) => any): MultiPresent {
    consumer(this.values, this.pair)
    return this
  }

  orUse(other: any) : MultiPresent {
    return this
  }

  orElse(other: any) : Array<any> {
    return this.values
  }

  orElseGet(supplier: () => any) : Array<any> {
    return this.values
  }

  orElseThrow(exceptionSupplier: () => any) : Array<any> {
    return this.values
  }

  filter(predicate: (values: Array<any>, pair?: any) => boolean) : Optional<any> {
    return predicate(this.values, this.pair) ? this : Optional.empty(this.original)
  }

  filterEach(predicate: (value: any, pair?: any) => boolean) : Optional<any> {
    let reducedValues = []
    this.values.forEach(val => {
      if (predicate(val, this.pair)) {
        reducedValues.push(val)
      }
    })
    return reducedValues.length > 0 ?
        MultiPresent.fromArray(reducedValues).setOriginal(this.original) : Optional.empty(this.original)
  }

  map(mapper: (values: Array<any>, pair?: any) => any) : Optional<any> {
    const result = mapper(this.values, this.pair)
    if (Array.isArray(result)) {
      return MultiPresent.fromArray(result).setOriginal(this.original)
    } else {
      return Optional.ofNullable(result).setOriginal(this.original)
    }
  }

  flatMap(mapper: (values: Array<any>, pair?: any) => Optional<any>): Optional<any> {
    const result = mapper(this.values, this.pair)
    return (result === null || result === undefined) ?
        Optional.empty(this.original) : result.setOriginal(this.original);
  }

  orElseMap(mapper: () => any): Optional<any> {
    return this
  }

  orElseFlatMap(mapper: () => Optional<any>): Optional<any> {
    return this
  }

  mapIf(predicate: (values: Array<any>, pair?: any) => boolean,
        mapper: (values: Array<any>, pair?: any) => any): Optional<any> {
    if (predicate(this.values, this.pair)) {
      return this.map(mapper)
    } else {
      this.isMapFilterOn = true
      return this
    }
  }

  orMapIf(predicate: (values: Array<any>, pair?: any) => boolean,
          mapper: (values: Array<any>, pair?: any) => any): Optional<any> {
    return this.isMapFilterOn && predicate(this.values, this.pair) ? this.map(mapper) : this
  }

  flatMapIf(predicate: (values: Array<any>, pair?: any) => boolean,
            mapper: (values: Array<any>, pair?: any) => Optional<any>): Optional<any> {
    if (predicate(this.values, this.pair)) {
        return this.flatMap(mapper)
    } else {
      this.isMapFilterOn = true
      return this
    }
  }

  orFlatMapIf(predicate: (values: Array<any>, pair?: any) => boolean,
              mapper: (values: Array<any>, pair?: any) => Optional<any>): Optional<any> {
    return this.isMapFilterOn && predicate(this.values, this.pair) ? this.flatMap(mapper) : this
  }

  then(consumer: (values: Array<any>, pair?: any) => void): Optional<any> {
    consumer(this.values, this.pair)
    return this
  }

  and(value: any): Optional<Array<any>> {
    if (value === null || value === undefined) {
      return Optional.empty(this.original)
    }
    this.values.push(value)
    return this
  }

  or(value: any): Optional<any> {
    return this
  }

  pairWith(pair: any): Optional<any> {
    this.pair = pair
    return this
  }

  ifOnlyLeft(consumer: (values: Array<any>) => void): Optional<any> {
    if (!this.pair) {
      consumer(this.values)
    }
    return this
  }

  ifOnlyRight(consumer: (pair: any) => void): Optional<any> {
    return this
  }

  ifBoth(consumer: (values: Array<any>, pair: any) => void): Optional<any> {
    if (this.pair) {
      consumer(this.values, this.pair)
    }
    return this
  }

  join(mapper: (values: Array<any>, pair?: any) => any): Optional<any> {
    const result = mapper(this.values, this.pair);
    if (result) {
      this.values.push(result)
      return this
    } else {
      return Optional.empty(this.original)
    }
  }

  joinMap(mapper: (values: Array<any>, pair?: any) => Optional<any>): Optional<any> {
    const result = mapper(this.values, this.pair);
    return result.map(value => {
      this.values.push(value)
      return this
    })
    .orElse(Optional.empty(this.original))
  }

  dropFirst(howMany: number = 1): Optional<any> {
    if (howMany > 0 && howMany <= this.values.length) {
      this.values = this.values.slice(howMany)
    }
    return this
  }

  dropLast(howMany: number = 1): Optional<any> {
    if (howMany > 0 && howMany <= this.values.length) {
      this.values = this.values.slice(0, this.values.length - howMany)
    }
    return this
  }

  toArray(): Array<any> {
    return this.values
  }

  clone(): Optional<any> {
    const m = new MultiPresent()
    m.values = this.values.slice()
    return m
  }

  setOriginal(original: Optional<any>): Optional<any> {
    this.original = original
    return this
  }
}

Optional.EMPTY = new Empty();