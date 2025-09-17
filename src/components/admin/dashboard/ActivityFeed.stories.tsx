import type { Meta, StoryObj } from '@storybook/react';
import ActivityFeed from './ActivityFeed';

const meta: Meta<typeof ActivityFeed> = {
  title: 'Admin/Dashboard/ActivityFeed',
  component: ActivityFeed,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Real-time activity feed displaying recent system events and user actions with filtering capabilities.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    maxItems: {
      control: 'number',
      description: 'Maximum number of activities to display',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    maxItems: 6,
  },
};

export const Compact: Story = {
  args: {
    maxItems: 3,
  },
};

export const Extended: Story = {
  args: {
    maxItems: 10,
  },
};

export const WithCustomClass: Story = {
  args: {
    maxItems: 6,
    className: 'shadow-lg',
  },
};

// Example of how it would look in a dashboard grid
export const InDashboardGrid: Story = {
  args: {
    maxItems: 8,
  },
  decorators: [
    (Story) => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-100 p-6 rounded-xl">
          <h3 className="font-semibold mb-4">Other Dashboard Component</h3>
          <p className="text-gray-600">This simulates other dashboard content</p>
        </div>
        <Story />
      </div>
    ),
  ],
};

export const Loading: Story = {
  args: {
    maxItems: 6,
  },
  // Simulate loading state by showing spinner
  decorators: [
    (Story) => (
      <div className="relative">
        <Story />
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    ),
  ],
};