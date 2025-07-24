/**
 * Safely fetch an entity by ID with error handling
 * @param {Function} entityGet - The entity's get method (e.g., Tour.get)
 * @param {string} id - The entity ID to fetch
 * @param {string} entityName - Name of the entity for logging
 * @returns {Promise<Object|null>} - The entity object or null if not found/error
 */
export const safeGet = async (entityGet, id, entityName = "Entity") => {
  console.log(`safeGet: Attempting to fetch ${entityName} with ID: '${id}' (Type: ${typeof id})`);
  
  if (!id || typeof id !== 'string' || id.trim() === '') {
    console.warn(`safeGet: Invalid or empty ID provided for ${entityName}: '${id}'. Aborting fetch.`);
    return null;
  }
  const trimmedId = id.trim();

  try {
    console.log(`safeGet: Calling SDK's get method for ${entityName} ID: '${trimmedId}'`);
    const result = await entityGet(trimmedId); // This is the actual entity SDK call, e.g., Tour.get(trimmedId)
    if (result) {
        console.log(`safeGet: Successfully fetched ${entityName} ID: '${trimmedId}'`, result);
    } else {
        // This case might occur if the SDK's get method returns null/undefined for a found-but-empty record,
        // though typically "Object not found" would throw an error.
        console.warn(`safeGet: Fetched ${entityName} ID: '${trimmedId}', but result is null or undefined.`);
    }
    return result;
  } catch (error) {
    console.error(`safeGet: Error caught while fetching ${entityName} ID '${trimmedId}'.`);
    console.error(`safeGet: Error type: ${error?.constructor?.name}, Error message: ${error?.message}`);
    // Log the full error object to inspect its properties, especially for SDK-specific error structures
    console.error("safeGet: Full error object details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // You can check for specific error messages or types if the SDK provides them
    // For example, if (error.message && error.message.includes("Object not found")) { ... }
    
    return null; // Return null to indicate failure, allowing calling code to handle it
  }
};

/**
 * Safely filter entities with error handling
 * @param {Function} entityFilter - The entity's filter method (e.g., Tour.filter)
 * @param {Object} filterCriteria - The filter criteria
 * @param {string} sort - Sort field
 * @param {number} limit - Result limit
 * @param {string} entityName - Name of the entity for logging
 * @returns {Promise<Array>} - Array of entities or empty array if error
 */
export const safeFilter = async (entityFilter, filterCriteria, sort, limit, entityName = "Entity") => {
  console.log(`safeFilter: Attempting to filter ${entityName} with criteria:`, filterCriteria);
  try {
    const results = await entityFilter(filterCriteria, sort, limit);
    console.log(`safeFilter: Successfully filtered ${entityName}. Found ${results?.length || 0} items.`);
    return results || []; // Ensure an array is always returned
  } catch (error) {
    console.error(`safeFilter: Error caught while filtering ${entityName}.`);
    console.error(`safeFilter: Error type: ${error?.constructor?.name}, Error message: ${error?.message}`);
    console.error("safeFilter: Full error object details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return []; // Return empty array on error
  }
};