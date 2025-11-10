<script lang="ts">
	import { onMount } from 'svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faRotateRight,
		faRotateLeft,
		faSearchPlus,
		faSearchMinus,
		faCheck,
		faTimes,
		faCompress
	} from '@fortawesome/free-solid-svg-icons';
	import Button from './Button.svelte';
	import Modal from './Modal.svelte';

	let {
		imageFile = $bindable(null),
		aspectRatio = 1,
		open = false,
		onCropComplete,
		onCancel,
		minWidth = 100,
		minHeight = 100,
		outputFormat = 'image/jpeg',
		outputQuality = 0.9
	} = $props();

	let canvasElement = $state<HTMLCanvasElement>();
	let containerElement = $state<HTMLDivElement>();
	let imageElement = $state<HTMLImageElement>();

	// Image state
	let imageLoaded = $state(false);
	let imageUrl = $state<string | null>(null);

	// Crop state
	let scale = $state(1);
	let rotation = $state(0);
	let translateX = $state(0);
	let translateY = $state(0);

	// Interaction state
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let startTranslateX = $state(0);
	let startTranslateY = $state(0);

	// Crop area dimensions
	let cropWidth = $state(300);
	let cropHeight = $state(300);
	let containerWidth = $state(0);
	let containerHeight = $state(0);

	// Load image when file changes
	$effect(() => {
		if (imageFile && open) {
			const reader = new FileReader();
			reader.onload = (e) => {
				imageUrl = e.target?.result as string;
			};
			reader.readAsDataURL(imageFile);
		} else {
			imageUrl = null;
			imageLoaded = false;
			resetTransform();
		}
	});

	// Calculate crop dimensions based on aspect ratio
	$effect(() => {
		if (containerWidth > 0 && containerHeight > 0) {
			const maxSize = Math.min(containerWidth, containerHeight) * 0.7;
			if (aspectRatio >= 1) {
				cropWidth = maxSize;
				cropHeight = maxSize / aspectRatio;
			} else {
				cropHeight = maxSize;
				cropWidth = maxSize * aspectRatio;
			}
		}
	});

	function handleImageLoad() {
		imageLoaded = true;
		resetTransform();
	}

	function resetTransform() {
		scale = 1;
		rotation = 0;
		translateX = 0;
		translateY = 0;
	}

	function handleZoomIn() {
		scale = Math.min(scale * 1.2, 5);
	}

	function handleZoomOut() {
		scale = Math.max(scale / 1.2, 0.5);
	}

	function handleRotateLeft() {
		rotation = (rotation - 90) % 360;
	}

	function handleRotateRight() {
		rotation = (rotation + 90) % 360;
	}

	function handleMouseDown(e: MouseEvent) {
		if (!imageLoaded) return;
		isDragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		startTranslateX = translateX;
		startTranslateY = translateY;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		const deltaX = e.clientX - dragStartX;
		const deltaY = e.clientY - dragStartY;
		translateX = startTranslateX + deltaX;
		translateY = startTranslateY + deltaY;
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		if (e.deltaY < 0) {
			handleZoomIn();
		} else {
			handleZoomOut();
		}
	}

	async function handleCrop() {
		console.log('handleCrop called');
		if (!canvasElement || !imageElement || !imageLoaded || !containerElement) {
			console.error('Missing elements:', {
				canvasElement,
				imageElement,
				imageLoaded,
				containerElement
			});
			return false;
		}

		const canvas = canvasElement;
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			console.error('Could not get canvas context');
			return false;
		}

		// Create an offscreen canvas for the full transformed image
		const offscreenCanvas = document.createElement('canvas');
		const offscreenCtx = offscreenCanvas.getContext('2d');
		if (!offscreenCtx) return false;

		// Get container dimensions
		const containerW = containerElement.offsetWidth;
		const containerH = containerElement.offsetHeight;

		// Set offscreen canvas to container size
		offscreenCanvas.width = containerW;
		offscreenCanvas.height = containerH;

		// Calculate how the image fits in the container
		const img = imageElement;

		// Get the ACTUAL displayed size of the image element
		const displayWidth = img.offsetWidth;
		const displayHeight = img.offsetHeight;

		console.log('Image display size:', displayWidth, 'x', displayHeight);
		console.log('Transform:', { translateX, translateY, rotation, scale });

		// Draw the transformed image on the offscreen canvas
		offscreenCtx.save();
		offscreenCtx.translate(containerW / 2 + translateX, containerH / 2 + translateY);
		offscreenCtx.rotate((rotation * Math.PI) / 180);
		offscreenCtx.scale(scale, scale);
		offscreenCtx.drawImage(img, -displayWidth / 2, -displayHeight / 2, displayWidth, displayHeight);
		offscreenCtx.restore();

		// Now extract the crop area from the offscreen canvas
		const cropX = (containerW - cropWidth) / 2;
		const cropY = (containerH - cropHeight) / 2;

		console.log('Crop area:', { cropX, cropY, cropWidth, cropHeight });

		// Set output canvas size
		const outputWidth = Math.max(cropWidth, minWidth);
		const outputHeight = Math.max(cropHeight, minHeight);
		canvas.width = outputWidth;
		canvas.height = outputHeight;

		// Extract and draw the cropped area
		ctx.drawImage(
			offscreenCanvas,
			cropX,
			cropY,
			cropWidth,
			cropHeight,
			0,
			0,
			outputWidth,
			outputHeight
		);

		console.log('Crop complete, dimensions:', outputWidth, 'x', outputHeight);

		// Convert to blob
		canvas.toBlob(
			(blob) => {
				if (blob) {
					console.log('Blob created, size:', blob.size);
					const croppedUrl = URL.createObjectURL(blob);
					onCropComplete?.(blob, croppedUrl);
				} else {
					console.error('Failed to create blob');
				}
			},
			outputFormat,
			outputQuality
		);

		return true;
	}

	function handleCancel() {
		resetTransform();
		onCancel?.();
	}

	onMount(() => {
		// Update container dimensions
		if (containerElement) {
			const updateDimensions = () => {
				if (containerElement) {
					containerWidth = containerElement.offsetWidth;
					containerHeight = containerElement.offsetHeight;
				}
			};
			updateDimensions();

			const resizeObserver = new ResizeObserver(updateDimensions);
			resizeObserver.observe(containerElement);

			return () => resizeObserver.disconnect();
		}
	});
</script>

<svelte:window onmouseup={handleMouseUp} onmousemove={handleMouseMove} />

<Modal isOpen={open} onClose={handleCancel} title="Crop Image" size="large">
	<div class="cropper-container">
		<div class="cropper-preview" bind:this={containerElement} onwheel={handleWheel}>
			{#if imageUrl}
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<img
					bind:this={imageElement}
					src={imageUrl}
					alt="To crop"
					class="cropper-image"
					class:loaded={imageLoaded}
					onload={handleImageLoad}
					style="
						transform: translate({translateX}px, {translateY}px) rotate({rotation}deg) scale({scale});
						cursor: {isDragging ? 'grabbing' : 'grab'};
					"
					onmousedown={handleMouseDown}
					draggable="false"
				/>

				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="crop-area"
					style="width: {cropWidth}px; height: {cropHeight}px;"
					onmousedown={(e) => e.stopPropagation()}
				>
					<div class="crop-border"></div>
					<div class="crop-grid">
						<div class="grid-line grid-line-v"></div>
						<div class="grid-line grid-line-v"></div>
						<div class="grid-line grid-line-h"></div>
						<div class="grid-line grid-line-h"></div>
					</div>
				</div>
			{:else}
				<div class="cropper-placeholder">
					<p>Loading image...</p>
				</div>
			{/if}
		</div>

		<div class="cropper-controls">
			<div class="control-group">
				<span class="control-label">Zoom</span>
				<div class="control-buttons">
					<button
						type="button"
						class="control-button"
						onclick={handleZoomOut}
						disabled={!imageLoaded}
					>
						<FontAwesomeIcon icon={faSearchMinus} />
					</button>
					<span class="zoom-level">{Math.round(scale * 100)}%</span>
					<button
						type="button"
						class="control-button"
						onclick={handleZoomIn}
						disabled={!imageLoaded}
					>
						<FontAwesomeIcon icon={faSearchPlus} />
					</button>
				</div>
			</div>

			<div class="control-group">
				<span class="control-label">Rotate</span>
				<div class="control-buttons">
					<button
						type="button"
						class="control-button"
						onclick={handleRotateLeft}
						disabled={!imageLoaded}
					>
						<FontAwesomeIcon icon={faRotateLeft} />
					</button>
					<span class="rotation-angle">{rotation}°</span>
					<button
						type="button"
						class="control-button"
						onclick={handleRotateRight}
						disabled={!imageLoaded}
					>
						<FontAwesomeIcon icon={faRotateRight} />
					</button>
				</div>
			</div>

			<div class="control-group">
				<button
					type="button"
					class="control-button"
					onclick={resetTransform}
					disabled={!imageLoaded}
				>
					<FontAwesomeIcon icon={faCompress} />
					<span>Reset</span>
				</button>
			</div>
		</div>
	</div>

	<div class="modal-actions">
		<Button variant="secondary" onClick={handleCancel}>
			<FontAwesomeIcon icon={faTimes} />
			Cancel
		</Button>
		<Button variant="primary" onClick={handleCrop} disabled={!imageLoaded}>
			<FontAwesomeIcon icon={faCheck} />
			Crop Image
		</Button>
	</div>
</Modal>

<canvas bind:this={canvasElement} style="display: none;"></canvas>

<style>
	.cropper-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		height: 70vh;
		max-height: 600px;
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.cropper-preview {
		flex: 1;
		position: relative;
		background: var(--background-color-1);
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 400px;
	}

	.cropper-image {
		max-width: 90%;
		max-height: 90%;
		object-fit: contain;
		user-select: none;
		-webkit-user-drag: none;
		transition: opacity 0.3s ease;
		opacity: 0;
	}

	.cropper-image.loaded {
		opacity: 1;
	}

	.crop-area {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
	}

	.crop-border {
		position: absolute;
		inset: 0;
		border: 2px solid rgba(255, 255, 255, 0.9);
		box-shadow:
			0 0 0 9999px rgba(0, 0, 0, 0.5),
			inset 0 0 0 1px rgba(0, 0, 0, 0.5);
		border-radius: 4px;
	}

	.crop-grid {
		position: absolute;
		inset: 0;
		opacity: 0.5;
	}

	.grid-line {
		position: absolute;
		background: rgba(255, 255, 255, 0.5);
	}

	.grid-line-v {
		width: 1px;
		height: 100%;
		top: 0;
	}

	.grid-line-v:nth-child(1) {
		left: 33.33%;
	}

	.grid-line-v:nth-child(2) {
		left: 66.66%;
	}

	.grid-line-h {
		width: 100%;
		height: 1px;
		left: 0;
	}

	.grid-line-h:nth-child(3) {
		top: 33.33%;
	}

	.grid-line-h:nth-child(4) {
		top: 66.66%;
	}

	.cropper-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-color-3);
	}

	.cropper-controls {
		display: flex;
		gap: 2rem;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
	}

	.control-label {
		font-size: 0.875rem;
		color: var(--text-color-2);
		font-weight: 500;
	}

	.control-buttons {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.control-button {
		padding: 0.5rem 1rem;
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.375rem;
		color: var(--text-color-1);
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.control-button:hover:not(:disabled) {
		background: var(--background-color-3);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.control-button:active:not(:disabled) {
		transform: scale(0.95);
	}

	.control-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.zoom-level,
	.rotation-angle {
		min-width: 50px;
		text-align: center;
		font-size: 0.875rem;
		color: var(--text-color-2);
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.cropper-container {
			height: 60vh;
		}

		.cropper-preview {
			min-height: 300px;
		}

		.cropper-controls {
			gap: 1rem;
		}

		.control-group {
			min-width: 100%;
		}

		.control-buttons {
			width: 100%;
			justify-content: space-between;
		}
	}
</style>
