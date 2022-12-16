# Shall `Participants` return with `Starter`?

`Participants` function takes a context as an input and returns
all the participants of this context. It should return the `from`
not the `Starter` unless `Starter` IS the `from`.

If we do include `from` (`Starter` in some cases) in `Participant`
we have to ensure that they are the first participant, even if it
is not at the left.

Currently `LifelineLayer` uses it to get implicitly declared
participants for the root context; `FragmentXXX` use it to get
all involved participants of a sub context.

Related logic is in `ToCollector`. We can initialise `descendantTos`
with `from` before `walker.walk`. We need to consider that `from`
may be included in participant declaration and even in group.
So `onParticipant` must overwrite that.

`context` has the knowledge of `from`. So far we only expose the
`getInheritedFrom` function. It will be convenient that it returns
`from` directly.

However, we also need the `InheritedFrom` and `ProvidedFrom`
to calculate the translateX for Interactions.
