/* eslint-disable arrow-body-style */
// input: some name ==> output :Same Name
const capitalizeName = (str) => {
  // one-liner is not used as this is fastest in benchmarking in terms of performance.
  const arr = str.split(' ');
  arr.forEach((item, index) => {
    arr[index] = item.replace(item[0], item[0].toUpperCase());
  });
  return arr.join(' ');
};

const validateDuplicateDetailsForSingleField = (arrayOfElement, field) => {
  /**
   * @description for @function validateDuplicateDetailsFromFrontEnd
   * @param {Object} currentElement currentElement being compared with Array @var arrayOfElement
   * @param {number} indexValue index of currentElement in array @var arrayOfElement
   * @returns {Boolean}
   */
  const validateDuplicateDetailsFromFrontEnd = (currentElement, indexValue) => {
    const currentField = currentElement[field].trim();
    // checking whether element in the array are unique
    // and doesn't contain repeated values for ( emp_id || email || or any other value)
    const elementIsUnique = arrayOfElement.every((ele, eleIndex) => {
      if (
        ele[field].trim().toUpperCase() === currentField.toString().toUpperCase() &&
        eleIndex === indexValue // main condition to check whether element is compared with itself, then skip it(true)
      ) {
        // As we are checking duplicate object i.e(emp_id||email|| or any other value) with same
        // array,So the same element self(element comparing with itself) checking is skipped and returned as true
        return true;
      }

      return !(ele[field].trim().toUpperCase() === currentField.toString().toUpperCase());
    });
    return elementIsUnique; // true if element is unique else false
  };

  // main process start here
  const duplicateValueArray = arrayOfElement.reduce(
    (duplicateIndex, currentArrayElement, index) => {
      const isDuplicateData = validateDuplicateDetailsFromFrontEnd(currentArrayElement, index);
      if (!isDuplicateData) {
        // if element is duplicate then save its index in array and send it to frontend
        duplicateIndex.push(index);
        return duplicateIndex;
      }
      return duplicateIndex;
    },
    [], // to store index of row present in frontend which are duplicate.
  );
  return duplicateValueArray;
};

/**
 *
 * @param {Array<Object>} arrayOfElement contains element which needs to be validated for duplicate values.
 * @param {*} field1 custom field to be validated for duplicate along(&& operation) with field1.
 * @param {*} field2 custom field to be validated for duplicate along(&& operation) with field2.
 * @returns index of the element which are duplicate in the array Array.
 */
const validateDuplicateDataForTwoFields = (arrayOfElement, field1, field2) => {
  /**
   * @description for @function validateDuplicateDetailsFromFrontEnd
   * @param {Object} currentElement currentElement being compared with Array @var arrayOfElement
   * @param {number} indexValue index of currentElement in array @var arrayOfElement
   * @returns {Boolean}
   */
  const validateDuplicateDetailsFromFrontEnd = (currentElement, indexValue) => {
    const firstField = currentElement[field1]?.toString().trim() ?? currentElement[field1];
    const secondField = currentElement[field2]?.toString().trim() ?? currentElement[field2];
    // checking whether element in the array are unique and doesn't contain repeated values for (field1,
    // field2)
    const elementIsUnique = arrayOfElement.every((ele, eleIndex) => {
      if (
        (ele[field1]?.toString().trim() ?? ele[field1]) === firstField &&
        (ele[field2]?.toString().trim() ?? ele[field2]) === secondField &&
        eleIndex === indexValue // main condition to check whether element is compared with itself, then skip it(true)
      ) {
        // As we are checking duplicate object i.e(field1,field2) with same
        // array,So the same element self(element comparing with itself) checking is skipped and returned as true
        return true;
      }
      return !(
        (ele[field1]?.toString().trim() ?? ele[field1]) === firstField &&
        (ele[field2]?.toString().trim() ?? ele[field2]) === secondField
      );
    });
    return elementIsUnique; // true if element is unique else false
  };

  // main process start here
  const duplicateValueArray = arrayOfElement.reduce(
    (duplicateIndex, currentArrayElement, index) => {
      const isDuplicateData = validateDuplicateDetailsFromFrontEnd(currentArrayElement, index);
      if (!isDuplicateData) {
        // if element is duplicate then save its index in array and send it to frontend
        duplicateIndex.push(index);
        return duplicateIndex;
      }
      return duplicateIndex;
    },
    [], // to store index of row present in frontend which are duplicate.
  );
  return duplicateValueArray;
};

/**
 *
 * @param {Array<Object>} arrayOfElement contains element which needs to be validated for duplicate values.
 * @param {Object<Key>} field1 custom field to be validated for duplicate along(&& operation) with other fields.
 * @param {Object<Key>} field2 custom field to be validated for duplicate along(&& operation) with other fields.
 * @param {Object<Key>} field3 custom field to be validated for duplicate along(&& operation) with other fields
 * @returns index of the element which are duplicate in the array Array.
 */
const validateDuplicateDataForThreeFields = (arrayOfElement, field1, field2, field3) => {
  /**
   * @description for @function validateDuplicateDetailsFromFrontEnd
   * @param {Object} currentElement currentElement being compared with Array @var arrayOfElement
   * @param {number} indexValue index of currentElement in array @var arrayOfElement
   * @returns {Boolean}
   */
  const validateDuplicateDetailsFromFrontEnd = (currentElement, indexValue) => {
    // const trimStringForField=(element,fieldOfElement)=>{return element[fieldOfElement] ??  }

    const firstField = currentElement[field1]?.trim() ?? currentElement[field1]; // if null or undefined return same
    const secondField = currentElement[field2]?.trim() ?? currentElement[field2];
    const thirdField = currentElement[field3]?.trim() ?? currentElement[field3];

    // checking whether element in the array are unique and doesn't contain repeated values for (field1,
    // field2,field3)
    const elementIsUnique = arrayOfElement.every((ele, eleIndex) => {
      if (
        (ele[field1]?.trim() ?? ele[field1]) === firstField &&
        (ele[field2]?.trim() ?? ele[field2]) === secondField &&
        (ele[field3]?.trim() ?? ele[field3]) === thirdField &&
        eleIndex === indexValue // main condition to check whether element is compared with itself, then skip it(true)
      ) {
        // As we are checking duplicate object i.e(field1,field2,field3) with same
        // array,So the same element self(element comparing with itself) checking is skipped and returned as true
        return true;
      }
      return !(
        (ele[field1]?.trim() ?? ele[field1]) === firstField &&
        (ele[field2]?.trim() ?? ele[field2]) === secondField &&
        (ele[field3]?.trim() ?? ele[field3]) === thirdField
      );
    });
    return elementIsUnique; // true if element is unique else false
  };

  // main process start here
  const duplicateValueArray = arrayOfElement.reduce(
    (duplicateIndex, currentArrayElement, index) => {
      const isDuplicateData = validateDuplicateDetailsFromFrontEnd(currentArrayElement, index);
      if (!isDuplicateData) {
        // if element is duplicate then save its index in array and send it to frontend
        duplicateIndex.push(index);
        return duplicateIndex;
      }
      return duplicateIndex;
    },
    [], // to store index of row present in frontend which are duplicate.
  );
  return duplicateValueArray;
};

/**
 *
 * @param {Array<Object>} arrayOfElement contains element which needs to be validated for duplicate values.
 * @param {Object<Key>} field1 custom field to be validated for duplicate along(&& operation) with otherFields.
 * @param {Object<Key>} field2 custom field to be validated for duplicate along(&& operation) with otherFields.
 * @param {Object<Key>} field3 custom field to be validated for duplicate along(&& operation) with otherFields.
 * @param {Object<Key>} field4 custom field to be validated for duplicate along(&& operation) with otherFields.
 * @returns index of the element which are duplicate in the array Array.
 */
const validateDuplicateDataForFourFields = (arrayOfElement, field1, field2, field3, field4) => {
  /**
   * @description for @function validateDuplicateDetailsFromFrontEnd
   * @param {Object} currentElement currentElement being compared with Array @var arrayOfElement
   * @param {number} indexValue index of currentElement in array @var arrayOfElement
   * @returns {Boolean}
   */
  const validateDuplicateDetailsFromFrontEnd = (currentElement, indexValue) => {
    const firstField = currentElement[field1].toString().trim();
    const secondField = currentElement[field2].toString().trim();
    const thirdField = currentElement[field3].toString().trim();
    const fourthField = currentElement[field4].toString().trim();

    // checking whether element in the array are unique and doesn't contain repeated values for (field1,
    // field2,field3,field4)
    const elementIsUnique = arrayOfElement.every((ele, eleIndex) => {
      if (
        ele[field1].toString().trim() === firstField &&
        ele[field2].toString().trim() === secondField &&
        ele[field3].toString().trim() === thirdField &&
        ele[field4].toString().trim() === fourthField &&
        eleIndex === indexValue // main condition to check whether element is compared with itself, then skip it(true)
      ) {
        // As we are checking duplicate object i.e (field1,field2,field3,field4) with same
        // array,So the same element self(element comparing with itself) checking is skipped and returned as true
        return true;
      }

      return !(
        ele[field1].toString().trim() === firstField &&
        ele[field2].toString().trim() === secondField &&
        ele[field3].toString().trim() === thirdField &&
        ele[field4].toString().trim() === fourthField
      );
    });
    return elementIsUnique; // true if element is unique else false
  };

  // main process start here
  const duplicateValueArray = arrayOfElement.reduce(
    (duplicateIndex, currentArrayElement, index) => {
      const isDuplicateData = validateDuplicateDetailsFromFrontEnd(currentArrayElement, index);
      if (!isDuplicateData) {
        // if element is duplicate then save its index in array and send it to frontend
        duplicateIndex.push(index);
        return duplicateIndex;
      }
      return duplicateIndex;
    },
    [], // to store index of row present in frontend which are duplicate.
  );
  return duplicateValueArray;
};

const checkDuplicateDataExistenceForTwoFields = (dataFromDb, currentValue, field1, field2) => {
  return dataFromDb.find((element) => {
    const firstField = element[field1].trim();
    const secondField = element[field2].trim();
    /**
     * check whether same, @var firstField, @var secondField combination already
     * exist in database, if exist send true else send false
     */
    const duplicateDetails =
      firstField === currentValue[field1].trim() && secondField === currentValue[field2].trim();
    return duplicateDetails !== false;
  });
};

const compareNewAndExistingDatabaseDataForTwoFields = (newData, dataFromDb, field1, field2) => {
  return newData.reduce(
    // duplicateDataIndexValue is the index of row in Table present in frontend, it used to point
    // which rows is duplicate entry in frontend
    (duplicateDataIndexValue, currentValue, arrayIndex) => {
      const isDataDuplicate = checkDuplicateDataExistenceForTwoFields(dataFromDb, currentValue, field1, field2);
      if (isDataDuplicate) {
        return [...duplicateDataIndexValue, arrayIndex];
      }
      return duplicateDataIndexValue;
    },
    [],
  );
};

const checkDuplicateDataExistenceForThreeFields = (dataFromDb, currentValue, field1, field2, field3) => {
  return dataFromDb.find((element) => {
    const firstField = element[field1].toString().trim();
    const secondField = element[field2].toString().trim();
    const thirdField = element[field3].toString().trim();
    /**
     * check whether same, @var firstField, @var secondField ,@var thirdField combination already
     * exist in database, if exist send true else send false
     */
    const duplicateDetails =
      firstField === currentValue[field1].toString().trim() &&
      secondField === currentValue[field2].toString().trim() &&
      thirdField === currentValue[field3].toString().trim();
    return duplicateDetails !== false;
  });
};

const compareNewAndExistingDatabaseDataForThreeFields = (newData, dataFromDb, field1, field2, field3) => {
  return newData.reduce(
    // duplicateDataIndexValue is the index of row in Table present in frontend, it used to point
    // which rows is duplicate entry in frontend
    (duplicateDataIndexValue, currentValue, arrayIndex) => {
      const isDataDuplicate = checkDuplicateDataExistenceForThreeFields(
        dataFromDb,
        currentValue,
        field1,
        field2,
        field3,
      );
      if (isDataDuplicate) {
        return [...duplicateDataIndexValue, arrayIndex];
      }
      return duplicateDataIndexValue;
    },
    [],
  );
};

const promToolExtractOnlyResourceEmployeeIdFromElements = (arrayOfElement) => {
  // from a given array of elements extract only the resource_emp_id(unique)
  return [...new Set(arrayOfElement.map((element) => element.resource_emp_id?.toString().trim()))];
};

module.exports = {
  promToolExtractOnlyResourceEmployeeIdFromElements,
  compareNewAndExistingDatabaseDataForTwoFields,
  capitalizeName,
  validateDuplicateDetailsForSingleField,
  validateDuplicateDataForTwoFields,
  validateDuplicateDataForThreeFields,
  validateDuplicateDataForFourFields,
  compareNewAndExistingDatabaseDataForThreeFields,
};
