flowchart TD
    Start --> Customer_Enters_Store
    Customer_Enters_Store --> Customer_Makes_Purchase
    Customer_Makes_Purchase --> Is_Customer_Enrolled{Is Customer Enrolled?}
    Is_Customer_Enrolled -- No --> Ask_to_Join{Ask to Join Program?}
    Ask_to_Join -- Yes --> Enroll_Customer[Enroll Customer]
    Ask_to_Join -- No --> Complete_Transaction[Complete Transaction]
    Is_Customer_Enrolled -- Yes --> Retrieve_Loyalty[Retrieve Loyalty Information]
    Retrieve_Loyalty --> Update_Points[Update Points]
    Update_Points --> Points_Redeemable{Check for Points Redeemable?}
    Points_Redeemable -- Yes --> Offer_Redemption[Offer Redemption]
    Offer_Redemption --> Redeem_Points[Redeem Points & Apply Discount]
    Points_Redeemable -- No --> Complete_Transaction
    Redeem_Points --> Complete_Transaction
    Complete_Transaction --> End
