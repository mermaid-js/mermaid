erDiagram
    STUDENT {
        int student_id
        string name
        string address
        string contact_info
    }
    BUS {
        int bus_id
        string model
        string capacity
    }
    DRIVER {
        int driver_id
        string name
        string license_number
    }
    TRIP {
        int trip_id
        string destination
        float price
    }
    INVOICE {
        int invoice_id
        int student_id
        float amount
        date due_date
        date paid_date
    }
    MAINTENANCE {
        int maintenance_id
        int bus_id
        date date
        string description
        float cost
    }
    INSPECTION {
        int inspection_id
        int bus_id
        int inspector_id
        date date
        string status
        int kilometers
    }
    EMPLOYEE {
        int employee_id
        string name
        float salary
    }

    STUDENT }|..|| INVOICE
    STUDENT }|--|| TRIP
    BUS }|--|| INSPECTION
    BUS }|--|| MAINTENANCE
    BUS }|--|| TRIP
    DRIVER }|--|| BUS
    DRIVER }|--|| INSPECTION
    INSPECTOR }|--|| INSPECTION
    EMPLOYEE }|--|| DRIVER
    EMPLOYEE }|--|| INSPECTOR
