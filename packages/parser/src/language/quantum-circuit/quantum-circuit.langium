grammar QuantumCircuitGrammar
import "../common/common";

entry QuantumCircuit:
  NEWLINE*
  ("quantumCircuit" | "quantumCircuit-beta")
  (direction=('LR' | 'TD'))?
  NEWLINE*
  (
    TitleAndAccessibilities
    | wires=WireList
    | cbits=CbitList
    | gates+=GateDeclaration
    | barrier+=Barrier
    | NEWLINE
  )*
;

WireList:
  'wires' wires+=WireSpec (',' wires+=WireSpec)* EOL
;

CbitList:
  'cbits' cbits+=ID (',' cbits+=ID)* EOL
;

WireSpec:
  name=ID initialState=State?
;

State:
  value=PAREN_VALUE
;

GateDeclaration:
  name=ID params=Params? '[' wireRefs+=WireRef (',' wireRefs+=WireRef)* ']'
  ('->' captureTarget=ID | 'if' conditionCbit=ID)?
  EOL
;

WireRef:
  (zero='!')? (wire=ID | wireIdx=INT)
;

Params:
  value=PAREN_VALUE
;

Barrier:
  kind='barrier' EOL
;

terminal PAREN_VALUE: /\([^)]+\)/;
