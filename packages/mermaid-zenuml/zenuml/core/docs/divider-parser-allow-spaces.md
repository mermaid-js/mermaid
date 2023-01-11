This document describe the design of parsing rules for the `divider` statement.

## Typical use case

The `divider` statement is used to separate the sequence of statements into logical
groups.

For example, a HTTPS sequence can be separated into three logical groups:

1. Connect establishment
2. TLS handshake
3. HTTP request/response

```
Client->Server: TCP SYNC
Server->Client: TCP SYN+ACK
Client->Server: TCP ACK
== Connection Established ==
Client->Server: TLS Client Hello
Server->Client: TLS Server Hello
Server->Client: TLS Certificate
Server->Client: TLS Server Hello Done
== Certificate Check ==
Client->Server: TLS Client Key Exchange
Client->Server: TLS Change Cipher Spec
Client->Server: TLS Finished
Server->Client: TLS Change Cipher Spec
Server->Client: TLS Finished
== Key Exchange, Handshake Completed ==
Client->Server: HTTP Request
Server->Client: HTTP Response
```

## The Lexer

## `divider` is a statement

`divider` is treated as a statement as any other messages.
