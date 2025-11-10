# Image Cropper Component

## Overview

A reusable image cropping component for Svelte 5 that supports zoom, rotation, drag-and-drop positioning, and integrates seamlessly with the existing storage system.

## Features

- **Canvas-based cropping**: Pure client-side image manipulation
- **Interactive controls**:
  - Click and drag to reposition the image
  - Mousewheel to zoom in/out
  - Rotation buttons (90° increments)
  - Zoom buttons with percentage display
  - Reset button to restore defaults
- **Customizable aspect ratios**: Square (1:1), landscape (16:9), portrait (9:16), or any custom ratio
- **Grid overlay**: Rule-of-thirds composition guide
- **Output options**: JPEG, PNG, or WebP with quality control
- **Minimum dimensions**: Ensures output meets size requirements
- **Accessibility**: Proper focus management and keyboard support

## Components

### ImageCropper.svelte

The main cropping component with full manual control.

**Props:**

- `imageFile?: File | null` - The image file to crop
- `aspectRatio?: number` - Desired aspect ratio (default: 1 for square)
- `open?: boolean` - Controls modal visibility
- `onCropComplete?: (blob: Blob, dataUrl: string) => void` - Callback when cropping is complete
- `onCancel?: () => void` - Callback when cropping is cancelled
- `minWidth?: number` - Minimum output width (default: 100)
- `minHeight?: number` - Minimum output height (default: 100)
- `outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp'` - Output format (default: 'image/jpeg')
- `outputQuality?: number` - Output quality 0-1 (default: 0.9)

**Example:**

```svelte
<script>
	import ImageCropper from '$lib/components/ui/ImageCropper.svelte';

	let selectedFile = $state(null);
	let showCropper = $state(false);

	function handleFileSelect(event) {
		const file = event.target.files?.[0];
		if (file) {
			selectedFile = file;
			showCropper = true;
		}
	}

	function handleCropComplete(blob, dataUrl) {
		// blob: The cropped image as a Blob
		// dataUrl: The cropped image as a data URL for preview
		console.log('Cropped image:', blob);
		showCropper = false;
	}

	function handleCancel() {
		showCropper = false;
		selectedFile = null;
	}
</script>

<input type="file" accept="image/*" onchange={handleFileSelect} />

<ImageCropper
	imageFile={selectedFile}
	open={showCropper}
	aspectRatio={16 / 9}
	onCropComplete={handleCropComplete}
	onCancel={handleCancel}
	minWidth={400}
	minHeight={225}
	outputFormat="image/jpeg"
	outputQuality={0.85}
/>
```

### AvatarUpload.svelte (Enhanced)

The avatar upload component now supports optional image cropping.

**New Props:**

- `enableCrop?: boolean` - Enable image cropping before upload (default: false)

**Example:**

```svelte
<script>
	import AvatarUpload from '$lib/components/ui/AvatarUpload.svelte';

	let avatar = $state(null);

	function handleFileSelect(file) {
		// File is already cropped if enableCrop is true
		console.log('Selected file:', file);
		// Upload to server...
	}

	function handleDelete() {
		avatar = null;
		// Delete from server...
	}
</script>

<AvatarUpload
	currentAvatar={avatar}
	size="large"
	editable={true}
	enableCrop={true}
	onFileSelect={handleFileSelect}
	onDelete={handleDelete}
/>
```

## Usage in Profile Page

To use the cropper in the existing profile page:

```svelte
<!-- src/routes/panel/profile/+page.svelte -->

<!-- Replace the existing AvatarUpload -->
<AvatarUpload
	currentAvatar={data.user.avatar}
	size="large"
	editable={true}
	enableCrop={true} <!-- Add this prop -->
	onFileSelect={handleAvatarUpload}
	onDelete={handleAvatarDelete}
/>
```

## Integration with Storage System

The cropper outputs a `Blob` which can be converted to a `File` and uploaded using the existing storage system:

```typescript
import { saveUploadedFile } from '$lib/server/file-upload';

export const actions = {
	uploadAvatar: async ({ request, locals }) => {
		const formData = await request.formData();
		const file = formData.get('avatar') as File;

		if (file && file.size > 0) {
			const result = await saveUploadedFile(file, 'avatars');
			if (result.success) {
				// Update user avatar in database
				await db.update(users).set({ avatar: result.url }).where(eq(users.id, locals.user.id));
			}
		}
	}
};
```

## Aspect Ratio Examples

- **Square (1:1)**: `aspectRatio={1}`
- **Landscape (16:9)**: `aspectRatio={16/9}`
- **Portrait (9:16)**: `aspectRatio={9/16}`
- **Wide (21:9)**: `aspectRatio={21/9}`
- **Custom**: Any number (width/height)

## Browser Compatibility

- Modern browsers with Canvas API support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers supported

## Performance

- Client-side processing - no server required
- Efficient canvas rendering
- Optimized for images up to 5MB
- Responsive design for mobile and desktop
