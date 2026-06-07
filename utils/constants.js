const ROLES = {
    EMPLOYER: 'employer',
    CANDIDATE: 'candidate',
    ADMIN: 'admin'
}


const APPLICATION_STATUS = {
    PROCESSING: 'processing',
    ACCEPTED: 'accepted',
    DECLINED: 'declined',
    WITHDRAWN: 'withdrawn',
    DELETED: 'deleted'
}

const JOB_TYPE = {
    FULL_TIME: 'full-time',
    PART_TIME: 'part-time',
    CONTRACT: 'contract',
    INTERNSHIP: 'internship'
}

const JOB_STATUS = {
    ACCEPTING: 'accepting',
    FILLED: 'filled',
    CANCELED: 'canceled',
    DELETED: 'deleted'
}

module.exports = {
    ROLES,
    APPLICATION_STATUS,
    JOB_TYPE,
    JOB_STATUS
}