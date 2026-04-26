'use strict';

const BaseProcessor = require('./BaseProcessor');
const { register }  = require('../factory/ProcessorFactory');

// compiled once at startup, not every time validate() runs
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD format, used for valid_until

class CollegeIdProcessor extends BaseProcessor {

  // required: student_name, student_id, college_name, department, valid_until
  // optional: course, year_of_study
  validate(payload) {
    const errors = [];

    // ── student_name ───────────────────────────────────────────────────────
    if (payload.student_name === undefined || payload.student_name === null) {
      errors.push('student_name is required');
    } else if (typeof payload.student_name !== 'string') {
      errors.push('student_name must be a string');
    } else if (payload.student_name.trim().length === 0) {
      errors.push('student_name must not be empty or whitespace');
    }

    // ── student_id ─────────────────────────────────────────────────────────
    if (payload.student_id === undefined || payload.student_id === null) {
      errors.push('student_id is required');
    } else if (typeof payload.student_id !== 'string') {
      errors.push('student_id must be a string'); // string type so leading zeros in IDs are preserved
    } else if (payload.student_id.trim().length === 0) {
      errors.push('student_id must not be empty or whitespace');
    }

    // ── college_name ───────────────────────────────────────────────────────
    if (payload.college_name === undefined || payload.college_name === null) {
      errors.push('college_name is required');
    } else if (typeof payload.college_name !== 'string') {
      errors.push('college_name must be a string');
    } else if (payload.college_name.trim().length === 0) {
      errors.push('college_name must not be empty or whitespace');
    }

    // ── department ─────────────────────────────────────────────────────────
    if (payload.department === undefined || payload.department === null) {
      errors.push('department is required');
    } else if (typeof payload.department !== 'string') {
      errors.push('department must be a string');
    } else if (payload.department.trim().length === 0) {
      errors.push('department must not be empty or whitespace');
    }

    // ── valid_until ────────────────────────────────────────────────────────
    if (payload.valid_until === undefined || payload.valid_until === null) {
      errors.push('valid_until is required');
    } else if (typeof payload.valid_until !== 'string') {
      errors.push('valid_until must be a string in YYYY-MM-DD format');
    } else if (!DATE_REGEX.test(payload.valid_until)) {
      errors.push('valid_until must be in YYYY-MM-DD format');
    }

    // ── course (optional) ──────────────────────────────────────────────────
    if (payload.course !== undefined && payload.course !== null) {
      if (typeof payload.course !== 'string') {
        errors.push('course must be a string');
      } else if (payload.course.trim().length === 0) {
        errors.push('course must not be empty if provided');
      }
    }

    // ── year_of_study (optional) ───────────────────────────────────────────
    if (payload.year_of_study !== undefined && payload.year_of_study !== null) {
      if (!Number.isInteger(payload.year_of_study)) {
        // catches floats, strings, NaN — all wrong
        errors.push('year_of_study must be an integer');
      } else if (payload.year_of_study < 1) {
        errors.push('year_of_study must be a positive integer (e.g. 1, 2, 3, 4)');
      }
    }

    return {
      valid:  errors.length === 0,
      errors,
    };
  }

  process(payload) {
    const processed = {
      student_name: payload.student_name.trim(),
      student_id:   payload.student_id.trim(),
      college_name: payload.college_name.trim(),
      department:   payload.department.trim(),
      valid_until:  payload.valid_until.trim(),
    };

    if (payload.course !== undefined && payload.course !== null) {
      processed.course = payload.course.trim();
    }
    if (payload.year_of_study !== undefined && payload.year_of_study !== null) {
      processed.year_of_study = payload.year_of_study; // already a valid integer
    }

    return processed;
  }
}

// registers 'college_id' in the factory as soon as this file is required
register('college_id', CollegeIdProcessor);

module.exports = CollegeIdProcessor;
