# StatCard Component

## Overview

The `StatCard` component is a reusable UI component for displaying key statistics and metrics across admin pages. It provides a consistent, visually appealing way to showcase important numbers and data points.

## Component Location

```
src/lib/components/ui/StatCard.svelte
```

## Features

- **Consistent Design**: Uniform appearance across all admin pages
- **Icon Support**: FontAwesome icon integration
- **Color Themes**: 6 color variants (blue, red, green, orange, purple, yellow)
- **Optional Links**: Can be made clickable with `href` prop
- **Responsive**: Adapts to mobile/tablet layouts
- **Hover Effects**: Smooth animations on interaction

## Usage

### Basic Example

```svelte
<script>
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import { faUsers } from '@fortawesome/free-solid-svg-icons';
</script>

<StatCard icon={faUsers} value={150} label="Total Users" color="blue" />
```

### With Link

```svelte
<StatCard icon={faUsers} value={150} label="Total Users" color="blue" href="/panel/admin/users" />
```

## Props

| Prop    | Type                                                             | Required | Default  | Description                             |
| ------- | ---------------------------------------------------------------- | -------- | -------- | --------------------------------------- |
| `icon`  | `IconDefinition`                                                 | Yes      | -        | FontAwesome icon to display             |
| `value` | `string \| number`                                               | Yes      | -        | The statistic value to display          |
| `label` | `string`                                                         | Yes      | -        | Label describing the statistic          |
| `color` | `'blue' \| 'red' \| 'green' \| 'orange' \| 'purple' \| 'yellow'` | No       | `'blue'` | Color theme for the icon background     |
| `href`  | `string`                                                         | No       | -        | Optional URL to make the card clickable |

## Color Meanings

- **Blue**: General information, users, data
- **Red**: Errors, security issues, locked accounts
- **Green**: Success, active items, positive metrics
- **Orange**: Warnings, activity, system roles
- **Purple**: Custom items, categories, pages
- **Yellow**: Special states, highlights

## Implementation Status

### ✅ Currently Used In

1. **Admin Dashboard** (`/panel/admin`)
   - Total Users (blue, clickable)
   - System Roles (red, clickable)
   - Activity (24h) (orange, clickable)
   - Failed Logins (24h) (red)

2. **Activity Logs** (`/panel/admin/activity`)
   - Total Logs (blue)
   - Success Rate (green)
   - Failed Actions (red)
   - Page Info (purple)

3. **User Management** (`/panel/admin/users`)
   - Total Users (blue)
   - Active Users (green)
   - Locked Accounts (red)
   - Failed Login Attempts (orange)

4. **Role Management** (`/panel/admin/roles`)
   - Total Roles (blue)
   - System Roles (orange)
   - Custom Roles (purple)
   - Total Assignments (green)

## Grid Layout

StatCards are designed to work with the existing CSS grid system:

```svelte
<!-- 4 columns on desktop, 2 on tablet, 1 on mobile -->
<div class="col-3 col-md-6 col-sm-12">
	<StatCard {...props} />
</div>
```

## Responsive Behavior

- **Desktop**: 60px icons, 2rem values, full padding
- **Tablet/Mobile**: 50px icons, 1.75rem values, reduced padding

## Best Practices

1. **Consistency**: Use similar metrics across related pages
2. **Meaningful Icons**: Choose icons that clearly represent the data
3. **Appropriate Colors**: Match colors to the semantic meaning of the stat
4. **Links**: Make cards clickable when they lead to relevant detail pages
5. **Number Formatting**: Use `toLocaleString()` for large numbers (e.g., 1,234)
6. **Percentages**: Include the `%` symbol in the value prop (e.g., `"85%"`)

## Examples by Use Case

### Users Statistics

```svelte
<StatCard icon={faUsers} value={users.length} label="Total Users" color="blue" />
<StatCard icon={faCheckCircle} value={activeUsers} label="Active" color="green" />
<StatCard icon={faLock} value={lockedUsers} label="Locked" color="red" />
```

### Activity Metrics

```svelte
<StatCard icon={faChartLine} value={todayCount} label="Today's Activity" color="orange" />
<StatCard icon={faHistory} value={totalLogs} label="Total Logs" color="blue" />
<StatCard icon={faPercent} value="{successRate}%" label="Success Rate" color="green" />
```

### Role/Permission Stats

```svelte
<StatCard icon={faShield} value={totalRoles} label="Total Roles" color="blue" />
<StatCard icon={faCog} value={systemRoles} label="System" color="orange" />
<StatCard icon={faLayerGroup} value={customRoles} label="Custom" color="purple" />
```

## Future Enhancements

Potential improvements for future versions:

1. **Trend Indicators**: Show percentage change with up/down arrows
2. **Loading States**: Skeleton loaders while data is fetching
3. **Custom Sizes**: Small/medium/large variants
4. **Sparklines**: Mini charts within cards
5. **Tooltips**: Additional context on hover
6. **Animation**: Count-up animations for values
7. **Comparison**: Side-by-side metric comparisons

## Related Components

- `Button.svelte` - Action buttons in card corners
- `Heading.svelte` - Page headers above stat grids
- `Card.svelte` - Full content cards with more detail
