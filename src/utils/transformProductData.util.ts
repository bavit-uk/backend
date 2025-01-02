export function transformProductData(data: any) {
  // Initialize the result object
  const result: any = {
    stepData: {
      productCategory: data.platformDetails.amazon.productCategory.$oid,
    },
  };

  // Helper function to create the common structure
  const createField = (name: any, value: any) => {
    return {
      name: name,
      value: value,
      isEbay: !!data.platformDetails.ebay[name],
      isAmz: !!data.platformDetails.amazon[name],
      isWeb: !!data.platformDetails.website[name],
    };
  };

  // List of fields to transform
  const fieldsToTransform = [
    "brand",
    "title",
    "screenSize",
    "productCondition",
    "nonNewConditionDetails",
    "images",
  ];

  // Transform each field
  fieldsToTransform.forEach((field) => {
    const value = data.platformDetails.amazon[field] || null;
    result.stepData[field] = createField(field, value);
  });

  return result;
}
