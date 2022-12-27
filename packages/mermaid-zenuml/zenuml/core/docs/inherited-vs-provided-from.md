What we should be looking at is `statement` which can be one of:

1. Alt/Par/Opt/Loop
1. Message
1. Creation

`stat`'s parent is always `block`. `block`'s parent is either `braceBlock`
or `prog`. If it is `prog` we are looking the `starter`; if it is `braceBlock`,
we need to find its parent message or creation and get their owners.

There are two ways to decide where the message is from.
One way is to deduce from its parent context - inherited from;
the other way is to explicitly define it from its own context -
provided from.

## Inherited

Sync message

```
A.m1 {
  // m2 has an "inherited from" as `A`
  m2
}
```

Async message

```
A.m1 {
  // m2 has an "inherited from" as `A`
  B:m2
}
```

## Provided

Sync message

```
A.m1 {
  // m2 has a "provided from" as `B`
  B->C.m2

}
```

Async message

```
A.m1 {
  // m2 has a "provided from" as `B`
  B->C:m2
}
```

It is allowed to have a `provided from` that equals to its
`inherited from`.

# Discussion

By definition, a root method has an `inherited from` as `Starter` or otherwise specified by `@StarterExp()`.

`Starter`, unless it is explicitly defined, will not be displayed on the lifeline layer.
