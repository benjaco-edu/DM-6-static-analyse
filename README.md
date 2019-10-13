# What is it
This is the handin for assignment 6 discrete math, static analyser.
This repo contains a single javascript file. This file holds the declaration of the code to be analysed in the top of the file (the variable code).

# How to make it go
Either
- Copy all the contense of the main.js file into the chrome-console (F12) and hit enter
(NB. due to use of 'eval' command, in the code, you might see the following: "Content Security Policy: The page’s settings blocked the loading of a resource at eval (“script-src”)." - if this is run in a firefox console) 

- use nodejs and execute the command:
```
node main.js
```

# Example 
This is an example of the output produced by the code.
Based on the following code
```
DEF X: INTEGER;
DEF Y: INTEGER;

IF (Y < 10) {
    LET X = 100;
}
LET Y = Y + 10;
IF (Y >= 20) {
    LET X = 4711;
    IF (Y < 40) {
        LET X = -1;
    }
}
```
The output will be:

```
DEF X: INTEGER          S = [X ∈ {...}]
DEF Y: INTEGER          S = [X ∈ {...}, Y ∈ {...}]
IF (Y < 10)             S = [X ∈ {...}, Y ∈ {...9}]
   LET X = 100          S = [X ∈ {100}, Y ∈ {...9}]
                        S = [X ∈ {100}, Y ∈ {...9}] ∨ [X ∈ {...}, Y ∈ {10...}]
LET Y = Y + 10          S = [X ∈ {100}, Y ∈ {...19}] ∨ [X ∈ {...}, Y ∈ {20...}]
IF (Y >= 20)            S = [X ∈ {...}, Y ∈ {20...}]
   LET X = 4711         S = [X ∈ {4711}, Y ∈ {20...}]
   IF (Y < 40)          S = [X ∈ {4711}, Y ∈ {20...39}]
     LET X = -1         S = [X ∈ {-1}, Y ∈ {20...39}]
                        S = [X ∈ {-1}, Y ∈ {20...39}] ∨ [X ∈ {4711}, Y ∈ {40...}]
                        S = [X ∈ {-1}, Y ∈ {20...39}] ∨ [X ∈ {4711}, Y ∈ {40...}] ∨ [X ∈ {100}, Y ∈ {...19}]

S = [X ∈ {-1}, Y ∈ {20...39}] ∨ [X ∈ {4711}, Y ∈ {40...}] ∨ [X ∈ {100}, Y ∈ {...19}]
```


# Deviasion
Boolean comparision have not been implemented likewise, neither have While-loops
