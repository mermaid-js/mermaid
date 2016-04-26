gitGraph BT:
options
{"key": "value",
"nodeSpacing": 150
}
end
    commit
    branch newbranch
    checkout newbranch
    commit
    commit
    checkout master
    commit
    commit
    merge newbranch

