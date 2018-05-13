function add (a, b) {
    if (b > 0) return add(++a, --b);
    return a;
}

function multiply (a, b, accum) {
    accum = accum || 0;
    if (b > 0) return multiply(a, --b, add(accum, a));
    return accum;
}

function square (x) {
    return multiply(x, x);
}
