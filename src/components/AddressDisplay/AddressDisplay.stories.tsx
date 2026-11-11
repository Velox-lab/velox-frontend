import type { Meta, StoryObj } from '@storybook/react';
import { AddressDisplay } from './AddressDisplay';

const SAMPLE_ADDRESS = 'GCKFBEIYTKP73W7KKWE7W5TLIWVZKBZ5I6TAWNBDWTSNUZPQOAA2VUQX';

const meta: Meta<typeof AddressDisplay> = {
  title: 'Components/AddressDisplay',
  component: AddressDisplay,
  args: {
    address: SAMPLE_ADDRESS,
  },
};

export default meta;
type Story = StoryObj<typeof AddressDisplay>;

export const Truncated: Story = {
  args: {
    truncate: true,
  },
};

export const FullAddress: Story = {
  args: {
    truncate: false,
  },
};

export const WithExplorerLink: Story = {
  args: {
    truncate: true,
    linkToExplorer: true,
  },
};
