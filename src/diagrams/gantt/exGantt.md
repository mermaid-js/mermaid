```
gantt
    dateFormat yyyy-mm-dd
    title Adding gantt diagram functionality to mermaid

    section Design
        Design jison grammar            :des1, 2014-01-01, 2014-01-04
        Create example text             :des2, 2014-01-01, 3d
        Bounce gantt example with users :des3, after des2, 5d

    section Implementation
        update build script             :2014-01-02,1h
        Implement parser and jison      :after des1, 2d
        Create tests for parser         :3d
        Create renderer                 :5d
        Create tests for renderer       :2d
        Add to mermaid core             :1d

    section Documentation
        Describe gantt syntax               :a1, 2014-01-01, 3d
        Add gantt diagram to demo page      :after a1  , 2h
        Add gantt to diagram to demo page   :after a1  , 2h
```
