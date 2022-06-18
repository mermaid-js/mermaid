# C4C Diagrams

**Edit this Page** [![N|Solid](img/GitHub-Mark-32px.png)](https://github.com/mermaid-js/mermaid/blob/develop/docs/gitgraph.md)
> C4 Diagram: This is an experimental diagram for now. The syntax and properties can change in future releases. Proper documentation will be provided when the syntax is stable.



Mermaid's c4 diagram syntax is compatible with plantUML. See example below:

```mermaid-example
    C4Context
      title System Context diagram for Internet Banking System
      Enterprise_Boundary(b0, "BankBoundary0") {
        Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")
        Person(customerB, "Banking Customer B")      
        Person_Ext(customerC, "Banking Customer C", "desc")            

        Person(customerD, "Banking Customer D", "A customer of the bank, <br/> with personal bank accounts.")

        System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")  

        Enterprise_Boundary(b1, "BankBoundary") {
         
          SystemDb_Ext(SystemE, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")      

          System_Boundary(b2, "BankBoundary2") {  
            System(SystemA, "Banking System A")  
            System(SystemB, "Banking System B", "A system of the bank, with personal bank accounts. next line.")        
          } 

          System_Ext(SystemC, "E-mail system", "The internal Microsoft Exchange e-mail system.") 
          SystemDb(SystemD, "Banking System D Database", "A system of the bank, with personal bank accounts.") 

          Boundary(b3, "BankBoundary3", "boundary") {  
            SystemQueue(SystemF, "Banking System F Queue", "A system of the bank.")        
            SystemQueue_Ext(SystemG, "Banking System G Queue", "A system of the bank, with personal bank accounts.") 
          }
        }
      }
      
      BiRel(customerA, SystemAA, "Uses")
      BiRel(SystemAA, SystemE, "Uses")
      Rel(SystemAA, SystemC, "Sends e-mails", "SMTP")
      Rel(SystemC, customerA, "Sends e-mails to")

      UpdateElementStyle(customerA, $fontColor="red", $bgColor="grey", $borderColor="red")
      UpdateRelStyle(customerA, SystemAA, $textColor="blue", $lineColor="blue", $offsetX="5")
      UpdateRelStyle(SystemAA, SystemE, $textColor="blue", $lineColor="blue", $offsetY="-10")
      UpdateRelStyle(SystemAA, SystemC, $textColor="blue", $lineColor="blue", $offsetY="-40", $offsetX="-50")
      UpdateRelStyle(SystemC, customerA, $textColor="red", $lineColor="red", $offsetX="-50", $offsetY="20")
      
      UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")


```

For an example, see the source code demos/index.html

5 types of C4 charts are supported.

 - System Context (C4Context)
 - Container diagram (C4Container)
 - Component diagram (C4Component)
 - Dynamic diagram (C4Dynamic)
 - Deployment diagram (C4Deployment)

Please refer to the linked document [C4-PlantUML syntax](https://github.com/plantuml-stdlib/C4-PlantUML/blob/master/README.md) for how to write the c4 diagram.

C4 diagram is fixed style, such as css color, so different css is not provided under different skins.
updateElementStyle and UpdateElementStyle are written in the diagram last part. updateElementStyle is inconsistent with the original definition and updates the style of the relationship, including the offset of the text label relative to the original position.

The layout does not use a fully automated layout algorithm. The position of shapes is adjusted by changing the order in which statements are written. So there is no plan to support the following Layout statements.
The number of shapes per row and the number of boundaries can be adjusted using UpdateLayoutConfig.

- Layout
- - Lay_U, Lay_Up
- - Lay_D, Lay_Down
- - Lay_L, Lay_Left
- - Lay_R, Lay_Right

The following unfinished features are not supported in the short term.

- [ ] sprite
- [ ] tags
- [ ] link
- [ ] Legend

- [X] System Context
- - [X] Person(alias, label, ?descr, ?sprite, ?tags, $link)
- - [X] Person_Ext
- - [X] System(alias, label, ?descr, ?sprite, ?tags, $link)
- - [X] SystemDb
- - [X] SystemQueue
- - [X] System_Ext
- - [X] SystemDb_Ext
- - [X] SystemQueue_Ext
- - [X] Boundary(alias, label, ?type, ?tags, $link)
- - [X] Enterprise_Boundary(alias, label, ?tags, $link)
- - [X] System_Boundary

- [X] Container diagram
- - [X] Container(alias, label, ?techn, ?descr, ?sprite, ?tags, $link)
- - [X] ContainerDb
- - [X] ContainerQueue
- - [X] Container_Ext
- - [X] ContainerDb_Ext
- - [X] ContainerQueue_Ext
- - [X] Container_Boundary(alias, label, ?tags, $link)

- [X] Component diagram
- - [X] Component(alias, label, ?techn, ?descr, ?sprite, ?tags, $link)
- - [X] ComponentDb
- - [X] ComponentQueue
- - [X] Component_Ext
- - [X] ComponentDb_Ext
- - [X] ComponentQueue_Ext

- [X] Dynamic diagram
- - [X] RelIndex(index, from, to, label, ?tags, $link)

- [X] Deployment diagram
- - [X] Deployment_Node(alias, label, ?type, ?descr, ?sprite, ?tags, $link)
- - [X] Node(alias, label, ?type, ?descr, ?sprite, ?tags, $link): short name of Deployment_Node()
- - [X] Node_L(alias, label, ?type, ?descr, ?sprite, ?tags, $link): left aligned Node()
- - [X] Node_R(alias, label, ?type, ?descr, ?sprite, ?tags, $link): right aligned Node()

- [X] Relationship Types
- - [X] Rel(from, to, label, ?techn, ?descr, ?sprite, ?tags, $link)
- - [X] BiRel (bidirectional relationship)
- - [X] Rel_U, Rel_Up
- - [X] Rel_D, Rel_Down
- - [X] Rel_L, Rel_Left
- - [X] Rel_R, Rel_Right
- - [X] Rel_Back
- - [X] RelIndex  * Compatible with C4-Plantuml syntax, but ignores the index parameter. The sequence number is determined by the order in which the rel statements are written.



- [ ] Custom tags/stereotypes support and skinparam updates
- - [ ] AddElementTag(tagStereo, ?bgColor, ?fontColor, ?borderColor, ?shadowing, ?shape, ?sprite, ?techn, ?legendText, ?legendSprite): Introduces a new element tag. The styles of the tagged elements are updated and the tag is displayed in the calculated legend.
- - [ ] AddRelTag(tagStereo, ?textColor, ?lineColor, ?lineStyle, ?sprite, ?techn, ?legendText, ?legendSprite): Introduces a new Relationship tag. The styles of the tagged relationships are updated and the tag is displayed in the calculated legend.
- - [X] UpdateElementStyle(elementName, ?bgColor, ?fontColor, ?borderColor, ?shadowing, ?shape, ?sprite, ?techn, ?legendText, ?legendSprite): This call updates the default style of the elements (component, ...) and creates no additional legend entry.
- - [X] UpdateRelStyle(from, to, ?textColor, ?lineColor, ?offsetX, ?offsetY): This call updates the default relationship colors and creates no additional legend entry. Two new parameters, offsetX and offsetY, are added to set the offset of the original position of the text.
- - [ ] RoundedBoxShape(): This call returns the name of the rounded box shape and can be used as ?shape argument.
- - [ ] EightSidedShape(): This call returns the name of the eight sided shape and can be used as ?shape argument.
- - [ ] DashedLine(): This call returns the name of the dashed line and can be used as ?lineStyle argument.
- - [ ] DottedLine(): This call returns the name of the dotted line and can be used as ?lineStyle argument.
- - [ ] BoldLine(): This call returns the name of the bold line and can be used as ?lineStyle argument.
- - [X] UpdateLayoutConfig(?c4ShapeInRow, ?c4BoundaryInRow): New. This call updates the default c4ShapeInRow(4) and c4BoundaryInRow(2). 


There are two ways to assign parameters with question marks. One uses the non-named parameter assignment method in the order of the parameters, and the other uses the named parameter assignment method, where the name must start with a $ symbol. 

Example: UpdateRelStyle(from, to, ?textColor, ?lineColor, ?offsetX, ?offsetY)
```
UpdateRelStyle(customerA, bankA, "red", "blue", "-40", "60")
UpdateRelStyle(customerA, bankA, $offsetX="-40", $offsetY="60", $lineColor="blue", $textColor="red")
UpdateRelStyle(customerA, bankA, $offsetY="60")

```