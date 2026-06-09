const USER_STATUS = {
    ACTIVE: 'active',
    BANNED: 'banned'
}

const ROLES = {
    EMPLOYER: 'employer',
    CANDIDATE: 'candidate',
    ADMIN: 'admin'
}


const APPLICATION_STATUS = {
    PROCESSING: 'processing',
    ACCEPTED: 'accepted',
    DECLINED: 'declined',
    WITHDRAWN: 'withdrawn'
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
}

const RESUME_STATUS = {
    DELETED: 'deleted'
}

module.exports = {
    USER_STATUS,
    ROLES,
    APPLICATION_STATUS,
    JOB_TYPE,
    JOB_STATUS,
    RESUME_STATUS
}