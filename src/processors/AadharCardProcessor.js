'use strict';

const BaseProcessor = require('./BaseProcessor');
const { register }  = require('../factory/ProcessorFactory');

// defined up here so they're compiled once at startup, not on every single request
const AADHAR_REGEX = /^\d{12}$/;            // must be exactly 12 digits, nothing else
const DATE_REGEX   = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD format
const MOBILE_REGEX = /^\d{10}$/;            // exactly 10 digits for Indian phone numbers

class AadharCardProcessor extends BaseProcessor {

  // requires full_name, aadhar_number, date_of_birth, address
  // optional info =  gender, mobile_number
  validate(payload) {
    const errors = []; // collect everything before returning so the client sees all problems at once

    // ── full_name ──────────────────────────────────────────────────────────
    if (payload.full_name === undefined || payload.full_name === null) {
      errors.push('full_name is required');
    } else if (typeof payload.full_name !== 'string') {
      errors.push('full_name must be a string');
    } else if (payload.full_name.trim().length === 0) {
      errors.push('full_name must not be empty or whitespace');
    }

    // ── aadhar_number ──────────────────────────────────────────────────────
    if (payload.aadhar_number === undefined || payload.aadhar_number === null) {
      errors.push('aadhar_number is required');
    } else if (typeof payload.aadhar_number !== 'string') {
      // must be a string not a number — aadhar numbers can start with 0
      // if we accepted a JS number, the leading 0 would silently disappear
      errors.push('aadhar_number must be a string of exactly 12 digits');
    } else if (!AADHAR_REGEX.test(payload.aadhar_number)) {
      errors.push('aadhar_number must be exactly 12 digits');
    }

    // ── date_of_birth ──────────────────────────────────────────────────────
    if (payload.date_of_birth === undefined || payload.date_of_birth === null) {
      errors.push('date_of_birth is required');
    } else if (typeof payload.date_of_birth !== 'string') {
      errors.push('date_of_birth must be a string in YYYY-MM-DD format');
    } else if (!DATE_REGEX.test(payload.date_of_birth)) {
      // just checking the format here, not whether the actual date exists on a calendar
      errors.push('date_of_birth must be in YYYY-MM-DD format');
    }

    // ── address ────────────────────────────────────────────────────────────
    if (payload.address === undefined || payload.address === null) {
      errors.push('address is required');
    } else if (typeof payload.address !== 'string') {
      errors.push('address must be a string');
    } else if (payload.address.trim().length === 0) {
      errors.push('address must not be empty or whitespace');
    }

    // ── gender (optional) ──────────────────────────────────────────────────
    if (payload.gender !== undefined && payload.gender !== null) {
      if (typeof payload.gender !== 'string') {
        errors.push('gender must be a string');
      } else if (payload.gender.trim().length === 0) {
        errors.push('gender must not be empty if provided');
      }
    }

    // ── mobile_number (optional) ───────────────────────────────────────────
    if (payload.mobile_number !== undefined && payload.mobile_number !== null) {
      if (typeof payload.mobile_number !== 'string') {
        errors.push('mobile_number must be a string of exactly 10 digits');
      } else if (!MOBILE_REGEX.test(payload.mobile_number)) {
        errors.push('mobile_number must be exactly 10 digits');
      }
    }

    return {
      valid:  errors.length === 0,
      errors,
    };
  }

  process(payload) {
    const processed = {
      full_name:     payload.full_name.trim(),
      aadhar_number: payload.aadhar_number.trim(),
      date_of_birth: payload.date_of_birth.trim(),
      address:       payload.address.trim(),
    };

    // only include optional fields if they were actually sent
    if (payload.gender !== undefined && payload.gender !== null) {
      processed.gender = payload.gender.trim();
    }
    if (payload.mobile_number !== undefined && payload.mobile_number !== null) {
      processed.mobile_number = payload.mobile_number.trim();
    }

    return processed;
  }
}

// this runs when the file is required and registers the type in the factory automatically
register('aadhar_card', AadharCardProcessor);

module.exports = AadharCardProcessor;
