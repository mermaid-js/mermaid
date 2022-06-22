# C4C Diagrams

**Edit this Page** [![N|Solid](img/GitHub-Mark-32px.png)](https://github.com/mermaid-js/mermaid/blob/develop/docs/gitgraph.md)
> C4 Diagram: This is an experimental diagram for now. The syntax and properties can change in future releases. Proper documentation will be provided when the syntax is stable.



Mermaid's c4 diagram syntax is compatible with plantUML. See example below:

```mermaid-example
    C4Context
      title System Context diagram for Internet Banking System

      Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")
      Person(customerB, "Banking Customer B")
      Person_Ext(customerC, "Banking Customer C")
      System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")

      Person(customerD, "Banking Customer D", "A customer of the bank, <br/> with personal bank accounts.")

      Enterprise_Boundary(b1, "BankBoundary") {

        SystemDb_Ext(SystemE, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")

        System_Boundary(b2, "BankBoundary2") {
          System(SystemA, "Banking System A")
          System(SystemB, "Banking System B", "A system of the bank, with personal bank accounts.")
        }

        System_Ext(SystemC, "E-mail system", "The internal Microsoft Exchange e-mail system.")
        SystemDb(SystemD, "Banking System D Database", "A system of the bank, with personal bank accounts.")

        Boundary(b3, "BankBoundary3", "boundary") {
          SystemQueue(SystemF, "Banking System F Queue", "A system of the bank, with personal bank accounts.")
          SystemQueue_Ext(SystemG, "Banking System G Queue", "A system of the bank, with personal bank accounts.")
        }
      }

      BiRel(customerA, SystemAA, "Uses")
      BiRel(SystemAA, SystemE, "Uses")
      Rel(SystemAA, SystemC, "Sends e-mails", "SMTP")
      Rel(SystemC, customerA, "Sends e-mails to")


```

