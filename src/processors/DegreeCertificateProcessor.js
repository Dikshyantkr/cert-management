'use strict';

const BaseProcessor = require('./BaseProcessor');
const { register }  = require('../factory/ProcessorFactory');

// to add a new document type, just copy this file as a starting point
// change the class name, the fields, and the register() call at the bottom
// nothing else in the project needs to change
class DegreeCertificateProcessor extends BaseProcessor {

  // required: student_name, degree, university, year_of_passing, grade
  // optional: roll_number, specialisation
  //
  // for each field: check it exists → check the type → check the content
  // we collect all errors before returning so the client gets everything at once
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

    // ── degree ─────────────────────────────────────────────────────────────
    if (payload.degree === undefined || payload.degree === null) {
      errors.push('degree is required');
    } else if (typeof payload.degree !== 'string') {
      errors.push('degree must be a string');
    } else if (payload.degree.trim().length === 0) {
      errors.push('degree must not be empty or whitespace');
    }

    // ── university ─────────────────────────────────────────────────────────
    if (payload.university === undefined || payload.university === null) {
      errors.push('university is required');
    } else if (typeof payload.university !== 'string') {
      errors.push('university must be a string');
    } else if (payload.university.trim().length === 0) {
      errors.push('university must not be empty or whitespace');
    }

    // ── year_of_passing ────────────────────────────────────────────────────
    if (payload.year_of_passing === undefined || payload.year_of_passing === null) {
      errors.push('year_of_passing is required');
    } else if (!Number.isInteger(payload.year_of_passing)) {
      // Number.isInteger catches strings like "2023", floats like 2023.5, NaN — all wrong
      errors.push('year_of_passing must be an integer');
    } else if (payload.year_of_passing < 1900 || payload.year_of_passing > 2100) {
      errors.push('year_of_passing must be between 1900 and 2100');
    }

    // ── grade ──────────────────────────────────────────────────────────────
    if (payload.grade === undefined || payload.grade === null) {
      errors.push('grade is required');
    } else if (typeof payload.grade !== 'string') {
      errors.push('grade must be a string');
    } else if (payload.grade.trim().length === 0) {
      errors.push('grade must not be empty or whitespace');
    }

    // ── roll_number (optional) ─────────────────────────────────────────────
    if (payload.roll_number !== undefined && payload.roll_number !== null) {
      if (typeof payload.roll_number !== 'string') {
        errors.push('roll_number must be a string');
      } else if (payload.roll_number.trim().length === 0) {
        errors.push('roll_number must not be empty if provided');
      }
    }

    // ── specialisation (optional) ──────────────────────────────────────────
    if (payload.specialisation !== undefined && payload.specialisation !== null) {
      if (typeof payload.specialisation !== 'string') {
        errors.push('specialisation must be a string');
      } else if (payload.specialisation.trim().length === 0) {
        errors.push('specialisation must not be empty if provided');
      }
    }

    return {
      valid:  errors.length === 0,
      errors,
    };
  }

  // only called after validate() passes, so all fields are guaranteed to exist with correct types
  process(payload) {
    const processed = {
      student_name:    payload.student_name.trim(),
      degree:          payload.degree.trim(),
      university:      payload.university.trim(),
      year_of_passing: payload.year_of_passing, // already an integer, nothing to trim
      grade:           payload.grade.trim(),
    };

    // skip optional fields if they weren't sent — no point storing undefined/null in the DB
    if (payload.roll_number !== undefined && payload.roll_number !== null) {
      processed.roll_number = payload.roll_number.trim();
    }
    if (payload.specialisation !== undefined && payload.specialisation !== null) {
      processed.specialisation = payload.specialisation.trim();
    }

    return processed;
  }
}

// runs at require() time — after this, 'degree_certificate' is in the factory
// the handler never needs to import this class directly
register('degree_certificate', DegreeCertificateProcessor);

module.exports = DegreeCertificateProcessor;
