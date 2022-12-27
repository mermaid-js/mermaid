There are two ways for the context to get declared Starter:

1. @Starter(X)
2. X->A:m or X->A.m

As long as the starter's name is not \_STARTER\_, it is treated as declared.

Then we check whether the Starter is a declared participant by its `explicit`
field.
