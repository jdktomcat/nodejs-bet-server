let errorCode = {
    0 : 'success',
    1001 : 'Key not found',
    1002 : 'Attempt to reuse the key',
    1003 : 'Key is expired',
    1004 : 'IP address does not match',
    1005 : 'Player is blocked',
    1006 : 'Player is not found',
    1007 : 'Session is expired',
    2001 : 'Not enough money',
    2002 : 'Invalid currency',
    2003 : 'Parent transaction not found',
    2004 : 'Bad request',
    2005 : 'Invalid JWT token',
    3001 : 'Bonus not found'
}

module.exports = {
    errorCode
}
