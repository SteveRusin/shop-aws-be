export default {
  type: "object",
  properties: {
    id: { type: 'number' },
    title: { type: 'string' },
    price: { type: 'number' },
    description: { type: 'string' },
    category: { type: 'string' },
    image: { type: 'string' },
  },
} as const;
