import dotenv from "dotenv";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "dev"}`,
});

export const processVariationsUtility = {
  // Enhanced processAttributesByCategory function
  processAttributesByCategory: (categoryName: string, attributes: any) => {
    switch (categoryName) {
      case "NOTEBOOK_COMPUTER": //LAPTOPS
        return processVariationsUtility.processNotebookComputerAttributes(attributes);
      case "PERSONAL_COMPUTER": //GAMING PC
        return processVariationsUtility.processPersonalComputerAttributes(attributes);
      case "MONITOR": //MONITOR
        return processVariationsUtility.processMonitorsAttributes(attributes);
      case "VIDEO_PROJECTOR": //VIDEO_PROJECTOR and for networking equipment category name is NETWORKING_DEVICE
        return processVariationsUtility.processProjectorAttributes(attributes);
      // Add new cases here as you add more categories in the future
      default:
        // Future categories can be handled here
        return processVariationsUtility.processOtherCategoryAttributes(attributes);
    }
  },

  processNotebookComputerAttributes: (attributes: any) => {
    const processedAttributes: any = {};

    const attributesObj = attributes instanceof Map ? Object.fromEntries(attributes) : attributes;

    //1- Processing for processor_description (just extracting the value)
    if (
      attributesObj.processor_description &&
      Array.isArray(attributesObj.processor_description) &&
      attributesObj.processor_description.length > 0
    ) {
      const processorResult = processVariationsUtility.processProcessorDescription(attributesObj.processor_description);
      if (processorResult.length > 0) {
        processedAttributes.processor_description = processorResult;
      }
    }

    //2- Ensure hard_disk size attribute exists and has valid data
    if (attributesObj.hard_disk && Array.isArray(attributesObj.hard_disk)) {
      const displayResult = processVariationsUtility.processHardDiskAttribute(attributesObj.hard_disk);
      if (displayResult.length > 0) {
        processedAttributes.hard_disk = displayResult;
      }
    }

    //3- Ensure display Size attribute exists and has valid data
    if (attributesObj.display && Array.isArray(attributesObj.display)) {
      const displayResult = processVariationsUtility.processDisplaySizeAttribute(attributesObj.display);
      if (displayResult.length > 0) {
        processedAttributes.display = displayResult;
      }
    }

    //4- Processing for memory_storage_capacity (concatenate `value` and `unit`)
    if (
      attributesObj.memory_storage_capacity &&
      Array.isArray(attributesObj.memory_storage_capacity) &&
      attributesObj.memory_storage_capacity.length > 0
    ) {
      const memoryResult: any = processVariationsUtility.processMemoryStorageCapacity(
        attributesObj.memory_storage_capacity
      );
      if (memoryResult.length > 0) {
        processedAttributes.memory_storage_capacity = memoryResult;
      }
    }
    //5- Ensure computer_memory attribute exists and has valid data
    if (attributesObj.computer_memory && Array.isArray(attributesObj.computer_memory)) {
      const displayResult = processVariationsUtility.processComputerMemoryAttribute(attributesObj.computer_memory);
      if (displayResult.length > 0) {
        processedAttributes.computer_memory = displayResult;
      }
    }
    // Returning only the processed attributes that have valid data
    return processedAttributes;
  },

  processPersonalComputerAttributes: (attributes: any) => {
    const processedAttributes: any = {};

    const attributesObj = attributes instanceof Map ? Object.fromEntries(attributes) : attributes;

    //1- Processing for processor_description (just extracting the value)
    if (
      attributesObj.processor_description &&
      Array.isArray(attributesObj.processor_description) &&
      attributesObj.processor_description.length > 0
    ) {
      const processorResult = processVariationsUtility.processProcessorDescription(attributesObj.processor_description);
      if (processorResult.length > 0) {
        processedAttributes.processor_description = processorResult;
      }
    }

    //2- Ensure hard_disk size attribute exists and has valid data
    if (attributesObj.hard_disk && Array.isArray(attributesObj.hard_disk) && attributesObj.hard_disk.length > 0) {
      const displayResult = processVariationsUtility.processHardDiskAttribute(attributesObj.hard_disk);
      if (displayResult.length > 0) {
        processedAttributes.hard_disk = displayResult;
      }
    }

    //3.- Ensure display Size attribute exists and has valid data
    if (attributesObj.display && Array.isArray(attributesObj.display)) {
      const displayResult = processVariationsUtility.processDisplaySizeAttribute(attributesObj.display);
      if (displayResult.length > 0) {
        processedAttributes.display = displayResult;
      }
    }

    //4-- Processing for solid_state_storage_drive (concatenate `capacity` values)
    if (
      attributesObj.solid_state_storage_drive &&
      Array.isArray(attributesObj.solid_state_storage_drive) &&
      attributesObj.solid_state_storage_drive.length > 0
    ) {
      const ssdResult: any = processVariationsUtility.processSolidStateStorageDrive(
        attributesObj.solid_state_storage_drive
      );
      if (ssdResult.length > 0) {
        processedAttributes.solid_state_storage_drive = ssdResult;
      }
    }
    //5- Ensure computer_memory attribute exists and has valid data
    if (attributesObj.computer_memory && Array.isArray(attributesObj.computer_memory)) {
      const displayResult = processVariationsUtility.processComputerMemoryAttribute(attributesObj.computer_memory);
      if (displayResult.length > 0) {
        processedAttributes.computer_memory = displayResult;
      }
    }

    //6- Processing for graphics_coprocessor (just extracting the value)
    if (
      attributesObj.graphics_coprocessor &&
      Array.isArray(attributesObj.graphics_coprocessor) &&
      attributesObj.graphics_coprocessor.length > 0
    ) {
      const processorResult = processVariationsUtility.processGraphicsCoProcessor(attributesObj.graphics_coprocessor);
      if (processorResult.length > 0) {
        processedAttributes.graphics_coprocessor = processorResult;
      }
    }

    //7- Processing for memory_storage_capacity (concatenate `value` and `unit`)
    if (
      attributesObj.memory_storage_capacity &&
      Array.isArray(attributesObj.memory_storage_capacity) &&
      attributesObj.memory_storage_capacity.length > 0
    ) {
      const memoryResult: any = processVariationsUtility.processMemoryStorageCapacity(
        attributesObj.memory_storage_capacity
      );
      if (memoryResult.length > 0) {
        processedAttributes.memory_storage_capacity = memoryResult;
      }
    }

    // Returning only the processed attributes that have valid data
    return processedAttributes;
  },

  processMonitorsAttributes: (attributes: any) => {
    const processedAttributes: any = {};

    const attributesObj = attributes instanceof Map ? Object.fromEntries(attributes) : attributes;

    if (attributesObj.display && Array.isArray(attributesObj.display)) {
      //1-- Process display Size attribute
      const displaySizeResult = processVariationsUtility.processDisplaySizeAttribute(attributesObj.display);
      if (displaySizeResult.length > 0) {
        processedAttributes.displaySize = displaySizeResult;
      }

      //2-- Process display Resolution Maximum attribute
      const displayResolutionResult = processVariationsUtility.processDisplayResolutionMaximumAttribute(
        attributesObj.display
      );
      if (displayResolutionResult.length > 0) {
        processedAttributes.displayResolution = displayResolutionResult;
      }
    }

    return processedAttributes;
  },

  processProjectorAttributes: (attributes: any) => {
    const processedAttributes: any = {};

    const attributesObj = attributes instanceof Map ? Object.fromEntries(attributes) : attributes;

    //1-- Ensure  aspect_ratio attribute exists and has valid data
    if (attributesObj.aspect_ratio && Array.isArray(attributesObj.aspect_ratio)) {
      const displayResult = processVariationsUtility.processAspectRatio(attributesObj.aspect_ratio);
      if (displayResult.length > 0) {
        processedAttributes.aspect_ratio = displayResult;
      }
    }
    //2- Ensure display technology attribute exists and has valid data
    if (attributesObj.display && Array.isArray(attributesObj.display)) {
      const displayResult = processVariationsUtility.processDisplayTechnology(attributesObj.display);
      if (displayResult.length > 0) {
        processedAttributes.display = displayResult;
      }
    }

    //4- Processing for image_brightness (concatenate `value` and `unit`)
    if (
      attributesObj.image_brightness &&
      Array.isArray(attributesObj.image_brightness) &&
      attributesObj.image_brightness.length > 0
    ) {
      const brightnessResult: any = processVariationsUtility.processImageBrightness(attributesObj.image_brightness);
      if (brightnessResult.length > 0) {
        processedAttributes.image_brightness = brightnessResult;
      }
    }
    return processedAttributes;
  },

  // **Placeholder for future categories**
  processOtherCategoryAttributes: (attributes: any) => {
    const processedAttributes: any = {};

    const attributesObj = attributes instanceof Map ? Object.fromEntries(attributes) : attributes;

    // Processing for RAM memory
    if (attributesObj.ram_memory && Array.isArray(attributesObj.ram_memory) && attributesObj.ram_memory.length > 0) {
      const ramResult = processVariationsUtility.processRamMemory(attributesObj.ram_memory);
      if (ramResult.length > 0) {
        processedAttributes.ram_memory = ramResult;
      }
    }

    //1- Processing for processor_description (just extracting the value)
    if (
      attributesObj.processor_description &&
      Array.isArray(attributesObj.processor_description) &&
      attributesObj.processor_description.length > 0
    ) {
      const processorResult = processVariationsUtility.processProcessorDescription(attributesObj.processor_description);
      if (processorResult.length > 0) {
        processedAttributes.processor_description = processorResult;
      }
    }

    //2- Processing for graphics_coprocessor (just extracting the value)
    if (
      attributesObj.graphics_coprocessor &&
      Array.isArray(attributesObj.graphics_coprocessor) &&
      attributesObj.graphics_coprocessor.length > 0
    ) {
      const processorResult = processVariationsUtility.processGraphicsCoProcessor(attributesObj.graphics_coprocessor);
      if (processorResult.length > 0) {
        processedAttributes.graphics_coprocessor = processorResult;
      }
    }

    //3- Ensure hard_disk attribute exists and has valid data
    if (attributesObj.hard_disk && Array.isArray(attributesObj.hard_disk) && attributesObj.hard_disk.length > 0) {
      const displayResult = processVariationsUtility.processHardDiskAttribute(attributesObj.hard_disk);
      if (displayResult.length > 0) {
        processedAttributes.hard_disk = displayResult;
      }
    }

    //4- Processing for memory_storage_capacity (concatenate `value` and `unit`)
    if (
      attributesObj.memory_storage_capacity &&
      Array.isArray(attributesObj.memory_storage_capacity) &&
      attributesObj.memory_storage_capacity.length > 0
    ) {
      const memoryResult: any = processVariationsUtility.processMemoryStorageCapacity(
        attributesObj.memory_storage_capacity
      );
      if (memoryResult.length > 0) {
        processedAttributes.memory_storage_capacity = memoryResult;
      }
    }

    //5- Ensure computer_memory attribute exists and has valid data
    if (attributesObj.computer_memory && Array.isArray(attributesObj.computer_memory)) {
      const displayResult = processVariationsUtility.processComputerMemoryAttribute(attributesObj.computer_memory);
      if (displayResult.length > 0) {
        processedAttributes.computer_memory = displayResult;
      }
    }
    //6- Ensure display Size attribute exists and has valid data
    if (attributesObj.display && Array.isArray(attributesObj.display)) {
      const displayResult = processVariationsUtility.processDisplaySizeAttribute(attributesObj.display);
      if (displayResult.length > 0) {
        processedAttributes.display = displayResult;
      }
    }

    // Returning only the processed attributes that have valid data
    return processedAttributes;
  },

  // Enhanced function to process 'display size' attribute with original structure
  processDisplaySizeAttribute: (attribute: any[]) => {
    console.log("Processing display Size attribute:", attribute);

    const displayVariations: any[] = [];

    attribute.forEach((displayItem) => {
      // Check if the size array contains more than one item
      if (displayItem.size && displayItem.size.length > 1) {
        displayItem.size.forEach((sizeItem: any) => {
          const displayValue = `${sizeItem.value} ${sizeItem.unit}`;

          const newDisplayItem = {
            ...displayItem,
            size: [sizeItem], // Only include the selected size
          };

          displayVariations.push({
            displayValue: displayValue,
            originalStructure: [newDisplayItem], // Keep as array like in DB
            attributeType: "size", // Add this to identify the attribute type
          });
        });
      }
    });

    return displayVariations;
  },

  // Enhanced function to process 'display technology' attribute with original structure
  processDisplayTechnology: (attribute: any[]) => {
    console.log("Processing display technology attribute:", attribute);

    const displayVariations: any[] = [];

    attribute.forEach((displayItem) => {
      // Check if the technology array contains more than one item
      if (displayItem.technology && displayItem.technology.length > 1) {
        displayItem.technology.forEach((techItem: any) => {
          const displayValue = `${techItem.value}`;

          const newDisplayItem = {
            ...displayItem,
            technology: [techItem], // Only include the selected technology
          };

          displayVariations.push({
            displayValue: displayValue,
            originalStructure: [newDisplayItem], // Keep as array like in DB
            attributeType: "technology", // Add this to identify the attribute type
          });
        });
      }
    });

    return displayVariations;
  },

  // Enhanced function to process 'display Resolution Maximum' attribute with original structure
  processDisplayResolutionMaximumAttribute: (attribute: any[]) => {
    console.log("Processing display resolution maximum attribute:", attribute);

    const displayVariations: any[] = [];

    attribute.forEach((displayItem) => {
      // Check if the resolution_maximum array contains more than one item
      if (displayItem.resolution_maximum && displayItem.resolution_maximum.length > 1) {
        displayItem.resolution_maximum.forEach((resolutionItem: any) => {
          const displayValue = `${resolutionItem.value} ${resolutionItem.unit}`;

          const newDisplayItem = {
            ...displayItem,
            resolution_maximum: [resolutionItem], // Only include the selected resolution_maximum
          };

          displayVariations.push({
            displayValue: displayValue,
            originalStructure: [newDisplayItem], // Keep as array like in DB
            attributeType: "resolution_maximum", // Add this to identify the attribute type
          });
        });
      }
    });

    return displayVariations;
  },

  processComputerMemoryAttribute: (attribute: any[]) => {
    console.log("Processing Computer Memory attribute:", attribute);

    const displayVariations: any[] = [];

    attribute.forEach((displayItem) => {
      if (displayItem.size && displayItem.size.length > 1) {
        displayItem.size.forEach((sizeItem: any) => {
          const displayValue = `${sizeItem.value} ${sizeItem.unit}`;

          const newDisplayItem = {
            ...displayItem,
            size: [sizeItem], // Only include the selected size
          };

          displayVariations.push({
            displayValue: displayValue,
            originalStructure: [newDisplayItem], // Keep as array like in DB
            attributeType: "size", // Add this to identify the attribute type
          });
        });
      }
    });

    return displayVariations;
  },

  // Enhanced function to process image_brightness attribute
  processImageBrightness: (attribute: any[]) => {
    if (attribute.length > 1) {
      return attribute.map((item) => ({
        displayValue: `${item.value} ${item.unit}`,
        originalStructure: [item], // Keep as array like in DB
      }));
    }

    // Return an empty array if there is only one item
    return [];
  },

  processHardDiskAttribute: (attribute: any[]) => {
    console.log("Processing Hard Disk attribute:", attribute);

    const displayVariations: any[] = [];

    attribute.forEach((displayItem) => {
      if (displayItem.size && displayItem.size.length > 1) {
        displayItem.size.forEach((sizeItem: any) => {
          const displayValue = `${sizeItem.value} ${sizeItem.unit}`;

          const newDisplayItem = {
            ...displayItem,
            size: [sizeItem], // Only include the selected size
          };

          displayVariations.push({
            displayValue: displayValue,
            originalStructure: [newDisplayItem], // Keep as array like in DB
            attributeType: "size", // Add this to identify the attribute type
          });
        });
      }
    });

    return displayVariations;
  },

  // Enhanced function to process 'processor_description' attribute
  processProcessorDescription: (attribute: any[]) => {
    // Only process if the attribute array has more than one item
    if (attribute.length > 1) {
      return attribute.map((item) => ({
        displayValue: item.value,
        originalStructure: [item], // Keep as array like in DB
      }));
    }

    // If there's only one item, return an empty array or skip variations
    return [];
  },

  // Enhanced function to process 'Graphics_CoProcessor' attribute
  processGraphicsCoProcessor: (attribute: any[]) => {
    // Only process if the attribute array has more than one item
    if (attribute.length > 1) {
      return attribute.map((item) => ({
        displayValue: item.value,
        originalStructure: [item], // Keep as array like in DB
      }));
    }

    // If there's only one item, return an empty array or skip variations
    return [];
  },

  // Enhanced function to process 'aspect_ratio' attribute
  processAspectRatio: (attribute: any[]) => {
    // Only process if the attribute array has more than one item
    if (attribute.length > 1) {
      return attribute.map((item) => ({
        displayValue: item.value,
        originalStructure: [item], // Keep as array like in DB
      }));
    }

    // If there's only one item, return an empty array or skip variations
    return [];
  },

  // Enhanced function to process 'memory_storage_capacity' attribute
  processMemoryStorageCapacity: (attribute: any[]) => {
    if (attribute.length > 1) {
      return attribute.map((item) => ({
        displayValue: `${item.value} ${item.unit}`,
        originalStructure: [item], // Keep as array like in DB
      }));
    }

    // Return an empty array if there is only one item
    return [];
  },

  // Enhanced function to process 'solid_state_storage_drive' attribute
  processSolidStateStorageDrive: (attribute: any[]) => {
    if (attribute.length > 1) {
      return attribute.map((item) => ({
        displayValue: `${item.capacity.value} ${item.capacity.unit}`,
        originalStructure: [item], // Keep as array like in DB
      }));
    }

    // Return an empty array if there is only one item
    return [];
  },

  // Enhanced function to process 'ram_memory' attribute
  processRamMemory: (attribute: any[]) => {
    const ramVariations: any[] = [];

    attribute.forEach((ramItem) => {
      if (ramItem.installed_size && ramItem.installed_size.length > 1) {
        ramItem.installed_size.forEach((installedSize: any) => {
          const displayValue = `${installedSize.value} ${installedSize.unit}`;

          const newRamItem = {
            ...ramItem,
            installed_size: [installedSize], // Only include the selected installed_size
          };

          ramVariations.push({
            displayValue: displayValue,
            originalStructure: [newRamItem], // Keep as array like in DB
            attributeType: "installed_size", // Add this to identify the attribute type
          });
        });
      }
    });

    return ramVariations;
  },
};
