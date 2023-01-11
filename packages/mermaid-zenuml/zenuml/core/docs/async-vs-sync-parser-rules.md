Async:

```
asyncMessage
 : source ARROW target COL content
 | source (MINUS | ARROW) target?
 ;

content
 : EVENT_PAYLOAD_LXR
 ;

source
 : ID | STRING
 ;

target
 : ID | STRING
 ;
```

Sync:

```
message
 : messageBody (SCOL | braceBlock)?
 ;

// Order of 'func | (to DOT)' is important. Otherwise A.m will be parsed as to messages
messageBody
 : assignment? ((from ARROW)? to DOT)? func
 | assignment
 | to DOT
 ;

// func is also used in exp as parameter with expr: (to DOT)? func;
func
 : signature (DOT signature)*
 ;

from
 : ID | STRING
 ;

signature
 : methodName invocation?
 ;

// We have removed the alternative rule with single OPAR as we are improving the editor to always close the brackets.
invocation
 : OPAR parameters? CPAR
 ;

assignment
 : (type? assignee ASSIGN)
 ;
```

First of all, `from->to` and `source->target` are very similar. Let's first merge them.

      if(!this.rightToLeft) {
        if(this.outOfBand) {
          // A    B     C
          // inh  pro   to
          const dist = this.distance2(this.origin, this.providedFrom)
          return dist - indent + fragmentOff
        } else {
          // A    B
          // inh  to
          // No self call indent here. It is used only for width.
          return fragmentOff
        }
      } else {
        // A    B     C
        // to   pro   origin
        // OR
        // A    B
        // to   origin
        const dist = this.distance2(this.to, this.origin)
        return (dist - indent - fragmentOff) * (-1)
      }
