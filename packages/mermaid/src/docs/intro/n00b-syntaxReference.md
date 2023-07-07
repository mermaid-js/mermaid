erDiagram
    Category ||--o{ Car : "Category_ID"
    Car ||--|{ Sale_Record : "Car_ID"
    Car ||--|{ Color : "Color_ID"
    Customer ||--|{ Sale_Record : "Customer_ID"
    Staff ||--|{ Sale_Record : "Staff_ID"

    Category {
        Category_ID (PK)
        Category_Name
    }
    Car {
        Car_ID (PK)
        Category_ID (FK)
        Car_Name
        Car_Model
        Color_ID (FK)
    }
    Color {
        Color_ID (PK)
        Color_Name
    }
    Customer {
        Customer_ID (PK)
        First_Name
        Last_Name
        Contact_Info
        Address
    }
    Staff {
        Staff_ID (PK)
        First_Name
        Last_Name
        Hire_Date
        Position
    }
    Sale_Record {
        Sale_ID (PK)
        Car_ID (FK)
        Customer_ID (FK)
        Staff_ID (FK)
        Sale_Date
        Sale_Price
    }
