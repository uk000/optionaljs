# optional.js
Provides an enhanced Optional monad for Typescript

## Why?
What makes this optional imeplemenation more powerful than regular optional monad:
- Multi-optional: In addition to wrapping a single optional value, it provides methods to wrap multiple optional values.
E.g. Optional.ofNullable(a).and(b).and(c).map(([a,b,c] => a+b+c).ifPresent(abc => console.log(abc))

- Store an additional (paired) value with the main optional value(s) of the monad. This allows an additional value to be made available to various lambdas that operate on the presence/absence of the main optional value(s)
E.g. Optional.ofNullable(a).pairWith(x)
      .ifPresent((a,x) => /*do something with a and x*/)
      .ifEmpty(x => console.log(x))

- various static and instance methods to create or combine values into optional:
of, ofNullable, for, from, if, orUse, orElse,  orElseGet, and, or, pairWith, join, joinMap

- Various enhanced functions to operate on optional values:
mapIf, flatMapIf, orMapIf, orFlatMapIf, ifOnlyLeft, ifOnlyRight, ifBoth, dropFirst, dropLast

- rewind and rebase: to be explained later

See test file "optional.test.ts" for detailed usage
