let code = `
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

`;

function clone(obj) {
    if (obj === null || typeof (obj) !== 'object' || 'isActiveClone' in obj)
        return obj;

    if (obj instanceof Date)
        var temp = new obj.constructor(); //or new Date(obj);
    else
        var temp = obj.constructor();

    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            obj['isActiveClone'] = null;
            temp[key] = clone(obj[key]);
            delete obj['isActiveClone'];
        }
    }
    return temp;
}

function parse(code) {
    let parts = code.split(/(;|\{|\})/).map(i => i.trim()).filter(i => !["", ";", "{"].includes(i));
    let tree = [];
    let cursor = "";
    let cursorTree = tree;

    let expression = text => {
        let varexp = text.match(/^([a-zA-Z_]+)$/);
        if (varexp) {
            return {
                expression: {
                    type: "var",
                    variable: varexp[1]
                }
            }
        }

        let negexp = text.match(/^-([a-zA-Z_]+)$/);
        if (negexp) {
            return {
                expression: {
                    type: "neg",
                    variable: negexp[1]
                }
            }
        }

        let exp = text.match(/^(\d+|TRUE|FALSE|[a-zA-Z_]+) (\+|-|<|<=|==|>=|>|!=) (\d+|TRUE|FALSE|[a-zA-Z_]+)$/);

        return {
            expression: {
                a: exp[1],
                type: exp[2],
                b: exp[3],
            }
        }
    };

    for (let i = 0; i < parts.length; i++) {
        const chunk = parts[i];

        let def = chunk.match(/^DEF ([a-zA-Z_]+): (INTEGER|BOOLEAN)$/);
        if (def) {
            cursorTree.push({
                block_type: "DEF",
                name: def[1],
                type: def[2],
                line: chunk
            });
            continue
        }

        let let_ = chunk.match(/^LET ([a-zA-Z_]+) = (.+)$/);
        if (let_) {
            let exp = let_[2];

            if (exp.match(/^(TRUE|FALSE|(-)?\d+)$/)) {
                cursorTree.push({
                    block_type: "LET",
                    name: let_[1],
                    value: let_[2],
                    line: chunk
                });
                continue
            }

            let parsedExpression = expression(exp);
            cursorTree.push({
                block_type: "LET",
                name: let_[1],
                ...parsedExpression,
                line: chunk
            });
            continue
        }

        let if_ = chunk.match(/^IF \((.+)\)$/);
        if (if_) {
            cursorTree.push({
                block_type: "IF",
                ...expression(if_[1]),
                trueBlock: [],
                falseBlock: [],
                line: chunk
            });
            cursorTree = cursorTree[cursorTree.length - 1].trueBlock;
            cursor += "T";
            continue
        }

        let while_ = chunk.match(/^WHILE \((.+)\)$/);
        if (while_) {
            cursorTree.push({
                block_type: "WHILE",
                ...expression(while_[1]),
                block: [],
                line: chunk
            });
            cursorTree = cursorTree[cursorTree.length - 1].block;
            cursor += "W";
            continue
        }


        if (chunk === "}") {
            if (parts[i + 1] === "ELSE") {
                cursor = cursor.substr(0, cursor.length - 1) + "F";
                i++;
            } else {
                cursor = cursor.substr(0, cursor.length - 1);
            }
            cursorTree = tree;

            for (let a of cursor.split("")) {
                cursorTree = cursorTree[cursorTree.length - 1];
                if (a === "T") {
                    cursorTree = cursorTree.trueBlock;
                }
                if (a === "F") {
                    cursorTree = cursorTree.falseBlock;
                }
                if (a === "W") {
                    cursorTree = cursorTree.block;
                }
            }

            continue
        }

        console.log("UNK; ERR; ", chunk);

    }

    return tree;
}

function finalState(blocks, state = [{}], pad = "") {

    for (let block of blocks) {
        switch (block.block_type) {
            case "DEF":
                if (block.type === "INTEGER") {
                    state.forEach(i => i[block.name] = [-Infinity, Infinity])
                }
                if (block.type === "BOOLEAN") {
                    state.forEach(i => i[block.name] = [true, false])
                }
                console.log(pad + block.line.padEnd(30), format(state))

                break;
            case "LET":
                if (block.value !== undefined) {
                    if (block.value == "FALSE") {
                        block.value = false;
                    } else if (block.value == "TRUE") {
                        block.value = true;
                    } else {
                        block.value = Number(block.value)
                    }
                    state.forEach(i => i[block.name] = [block.value])
                }
                if (block.expression !== undefined) {
                    if (block.expression.b != Number(block.expression.b) && block.expression.a !== "FALSE" && block.expression.a !== "TRUE") {
                        throw new Error("Algebra on multiple ranges Not implemented")
                    }
                    if (block.expression.a == Number(block.expression.a) || block.expression.a == "FALSE" || block.expression.a == "TRUE") {
                        state.forEach(i => i[block.name] = eval(block.expression.a + block.expression.type + block.expression.b))

                    } else {
                        for (let s of state) {
                            let tmp = clone(s[block.expression.a]);
                            tmp = tmp.map(i => eval(i + block.expression.type + block.expression.b))
                            s[block.name] = tmp;
                        }
                    }
                }
                console.log(pad + block.line.padEnd(30), format(state))

                break;
            case "IF":
                let trueStates = clone(state);
                let falseStates = clone(state);

                switch (block.expression.type) {
                    case "<":
                        trueStates.forEach(s => {
                            s[block.expression.a][1] = Number(block.expression.b) - 1
                        })
                        falseStates.forEach(s => {
                            s[block.expression.a][0] = Number(block.expression.b)
                        })
                        break;
                    case ">":
                        trueStates.forEach(s => {
                            s[block.expression.a][0] = Number(block.expression.b) + 1
                        })
                        falseStates.forEach(s => {
                            s[block.expression.a][1] = Number(block.expression.b)
                        })
                        break;
                    case "<=":
                        trueStates.forEach(s => {
                            s[block.expression.a][1] = Number(block.expression.b)
                        })
                        falseStates.forEach(s => {
                            s[block.expression.a][0] = Number(block.expression.b) + 1
                        })
                        break;
                    case ">=":
                        trueStates.forEach(s => {
                            s[block.expression.a][0] = Number(block.expression.b) 
                        })
                        falseStates.forEach(s => {
                            s[block.expression.a][1] = Number(block.expression.b) - 1
                        })
                        break;
                    case "==": throw new Error("== Not implemented")
                    case "AND": throw new Error("boolean logic Not implemented")
                    case "OR": throw new Error("boolean logic Not implemented")
                    case "NOT": throw new Error("boolean logic Not implemented")
                }

                trueStates = trueStates.filter( state => {
                    let keep = true
                    for(let value of Object.values(state))
                        if(value.length === 2)
                            if(value[0] > value[1])
                                keep = false;
                        
                    return keep
                })

                falseStates = falseStates.filter( state => {
                    let keep = true
                    for(let value of Object.values(state))
                        if(value.length === 2)
                            if(value[0] > value[1])
                                keep = false;
                        
                    return keep
                })

                console.log(pad + block.line.padEnd(30), format(trueStates))

                let eval_trueState = finalState(block.trueBlock, trueStates, pad+"  ")
                let eval_falseState = falseStates;
                if(block.falseBlock){
                    eval_falseState = finalState(block.falseBlock, falseStates, pad+"  ");
                }
                state = [...eval_trueState, ...eval_falseState];

                console.log(pad+"                              ", format(state))


                break;
            default:
                throw new Error(block.block_type + " not implementet")

        }

    }

    return state
}

function format(state){
    let states = state.map(scope => {
        let vars = []
        for(let [key, val] of Object.entries(scope)){
            let valvar = "";
            if(val.length == 1){
                valvar = val[0]
            }
            if(val.length == 2){
                if(val[0] == -Infinity && val[1] == Infinity ){
                    valvar = "..."
                } else if(val[0] == -Infinity ){
                    valvar = "..."+val[1]
                } else if(val[1] == Infinity ){
                    valvar = val[0]+"..."
                } else {
                    valvar = val[0]+"..."+val[1]
                }
            }
            vars.push(key+" ∈ {"+valvar+"}")
        }
        return vars.join(", ")
    })

    return `S = `+states.map(s => `[${s}]`).join(" ∨ ")
}

console.log('%c'+format(finalState(parse(code))), 'color: #32a852')

