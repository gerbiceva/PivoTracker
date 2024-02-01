export const intToEur = (cents: number) => {
    return (cents / 100);
}

export const pivoCena = (ordered: number) => {
    const gajbaPrice = 30;
    const pivoPrice = 1.5;
    let owed = 0;
    let numGajb = Math.floor(ordered / 24);
    owed += numGajb * gajbaPrice;
    ordered -= numGajb * 24;
    owed += ordered * pivoPrice;

    return owed;
};

export const pivoVGajba = (ordered: number, paid: number) => {
    const gajbaPrice = 30;
    const pivoPrice = 1.5;
    let owed = 0;
    let numGajb = Math.floor(ordered / 24);
    owed += numGajb * gajbaPrice;
    ordered -= numGajb * 24;
    owed += ordered * pivoPrice;

    return owed - paid;
};

export const numberToEur = (num: number) => {
    // format number to eur on two decimals
    return num.toFixed(2) ;
}