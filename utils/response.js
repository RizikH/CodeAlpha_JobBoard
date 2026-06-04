function success(res, data, statusCode = 200) {
    return res.status(statusCode).json({ success: true, data: data });
}

function error(res, message, statusCode = 400) {
    return res.status(statusCode).json({ success: false, message: message });
}

module.exports = {
    success,
    error
}