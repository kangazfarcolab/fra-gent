/**
 * Translation workflow template
 */

export const createTranslationWorkflow = (name: string, targetLanguage: string = 'Spanish') => {
  return {
    name,
    description: `Translate text to ${targetLanguage}`,
    tags: ['translation', targetLanguage.toLowerCase()],
    is_public: false,
    version: 1,
    success_rate: 1.0,
    avg_execution_time: 2.5,
    definition: {
      steps: [
        {
          id: 'step1',
          name: 'Translate Text',
          type: 'llm',
          position: { x: 300, y: 200 },
          config: {
            prompt: `Translate the following text to ${targetLanguage}:\n\n{{input.text}}`,
            target_language: targetLanguage,
            model: 'gpt-3.5-turbo',
            temperature: 0.3,
            max_tokens: 1000
          }
        }
      ],
      connections: [],
      output: {
        translation: { source: 'variables', path: 'step1.result' }
      }
    }
  };
};

export const createSummarizationWorkflow = (name: string) => {
  return {
    name,
    description: 'Summarize text',
    tags: ['summarization'],
    is_public: false,
    version: 1,
    success_rate: 1.0,
    avg_execution_time: 3.2,
    definition: {
      steps: [
        {
          id: 'step1',
          name: 'Summarize Text',
          type: 'llm',
          position: { x: 300, y: 200 },
          config: {
            prompt: 'Summarize the following text in a concise way:\n\n{{input.text}}',
            model: 'gpt-3.5-turbo',
            temperature: 0.3,
            max_tokens: 1000
          }
        }
      ],
      connections: [],
      output: {
        summary: { source: 'variables', path: 'step1.result' }
      }
    }
  };
};
