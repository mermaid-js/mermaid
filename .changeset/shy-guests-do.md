---
"mermaid": patchgraph TD
    %% Zone: ภายนอกและทางเข้า
    subgraph Exterior [โซนภายนอกและโรงรถแยก]
        MainGate(ประตูรั้วโครงการ) --> DropOff(จุดวนรถรับ-ส่ง Drop-off)
        MainGate --> GarageBldg[อาคารจอดรถ 2 ชั้น]
        
        subgraph Garage_Building [อาคารจอดรถ]
            Garage1F[ชั้น 1: จอดรถ 4 คัน] --> MaidZone[โซนแม่บ้าน & ซักล้าง]
            Garage1F --> DriverRoom[ห้องพักคนขับรถ]
            Garage1F --บันได/ลิฟต์--> Garage2F[ชั้น 2: Man Cave / Office]
        end
    end

    %% Connection
    GarageBldg -- ทางเดินเชื่อม Covered Walkway --> MainEntrance(ทางเข้าหลักบ้าน)
    DropOff --> MainEntrance

    %% Zone: ตัวบ้านชั้น 1
    subgraph Main_House_1F [ตัวบ้านชั้น 1: Public & Semi-Private]
        MainEntrance --> Foyer[โถงต้อนรับ Double Volume]
        Foyer --> ShoeRoom[ห้องเก็บรองเท้า]
        Foyer --> PowderRoom[ห้องน้ำแขก]
        
        Foyer --> GrandLiving[ห้องรับแขก Grand Living]
        GrandLiving -- วิวสระว่ายน้ำ --> PoolDeck[ระเบียงสระว่ายน้ำ & BBQ]
        
        GrandLiving --> Dining[โซนทานอาหาร]
        Dining --> Pantry[แพนทรีเตรียมอาหาร]
        Pantry --> ThaiKitchen[ครัวไทยปิด]
        ThaiKitchen --> ServiceExit(ออกไปลานซักล้าง)
        
        Foyer -- ทางเดินส่วนตัว --> Bedroom6[ห้องนอน 6: ผู้สูงอายุ]
        Bedroom6 --> Bath6[ห้องน้ำในตัว]
    end

    %% Vertical Circulation
    Foyer -- บันไดหลัก / ลิฟต์ --> FamilyHall_2F

    %% Zone: ตัวบ้านชั้น 2
    subgraph Main_House_2F [ตัวบ้านชั้น 2: Private Sanctuary]
        FamilyHall_2F[โถงนั่งเล่นครอบครัว]
        
        FamilyHall_2F --> MasterWing[ปีก Master Bedroom]
        subgraph Master_Zone [Master Wing]
            MasterWing --> MB_Sleep[ส่วนนอน]
            MB_Sleep --> MB_Living[มุมพักผ่อนส่วนตัว]
            MB_Sleep --> MB_Closet[Walk-in Closet ใหญ่]
            MB_Closet --> MB_Bath[ห้องน้ำ Master + อ่างอาบน้ำ]
        end
        
        FamilyHall_2F --> JuniorWing[ปีกห้องนอนลูก]
        subgraph Junior_Zone [Junior Wing]
            JuniorWing --> Bed2[ห้องนอน 2 + ห้องน้ำ]
            JuniorWing --> Bed3[ห้องนอน 3 + ห้องน้ำ]
            JuniorWing --> Bed4[ห้องนอน 4 + ห้องน้ำ]
            JuniorWing --> Bed5[ห้องนอน 5 + ห้องน้ำ]
        end
    end

    %% Styles
    style Garage_Building fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style Main_House_1F fill:#fff3e0,stroke:#ff6f00,stroke-width:2px
    style Main_House_2F fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style Master_Zone fill:#fce4ec,stroke:#880e4f,stroke-dasharray: 5 5

"@mermaid-js/docs": patch
---

Update layouts.md
