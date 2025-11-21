import { layouts } from '../lib/layouts.mjs'

globalThis.layouts = layouts

let IMAGE_ROOT
// if (window.location.href.includes('127.0.0.1')) {
//   IMAGE_ROOT = 'textures/'
// } else {
  IMAGE_ROOT = 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.16.4/'
// }

const IMAGE_ROOT_1_20 = 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/'

function patchPath (path) {
  if (IMAGE_ROOT.includes('.com')) { path = path.replace('block/', 'blocks/'); path = path.replace('item/', 'items/') }
  if (path.includes('enchant_table_anim'))path = 'enchant_table_anims2'
  return path
}

function getImageRoot (path, layoutName) {
  // Use 1.20+ assets for modern smithing table GUI (post Trails & Tales update)
  // Use 1.16.4 assets for legacy smithing table GUI (pre-1.20)
  if (path === 'gui/container/smithing') {
    if (layoutName === 'SmithingTable') {
      return IMAGE_ROOT_1_20
    } else if (layoutName === 'SmithingTableLegacy') {
      return IMAGE_ROOT
    }
  }
  return IMAGE_ROOT
}

const loadedImageBlobs = {}

const images = [
  'item/brick',
  'block/brain_coral',
  'item/redstone',
  'block/powered_rail_on',
  'block/bookshelf',
  'item/compass_00',
  'item/lava_bucket',
  'item/apple',
  'item/iron_axe',
  'item/golden_sword',
  'item/glass_bottle',
  'item/chest_minecart'
]

const smithingLayouts = []
for (const win in layouts) {
  const val = layouts[win]
  for (const key in val.with) {
    const path = val.with[key].path
    if (path) {
      if (!images.includes(path)) {
        images.push(path)
      }
      // Track all layouts using smithing table path
      if (path === 'gui/container/smithing') {
        smithingLayouts.push(win)
      }
    }
  }
}

function loadAllImagesWeb () {
  for (const path of images) {
    if (path === 'gui/container/smithing') {
      // Load both versions of smithing table
      for (const layoutName of smithingLayouts) {
        const root = getImageRoot(path, layoutName)
        const img = new Image()
        const cacheKey = `${path}_${layoutName}`
        img.src = patchPath(root + path) + '.png'
        img.onload = function () {
          loadedImageBlobs[cacheKey] = img
        }
      }
    } else {
      const img = new Image()
      const root = getImageRoot(path)
      img.src = patchPath(root + path) + '.png'
      img.onload = function () {
        loadedImageBlobs[path] = img
      }
    }
  }
}

function loadRuntimeImage (atPath, layoutName) {
  const img = new Image() // Create new img element
  // if (IMAGE_ROOT.includes('.com')) {atPath = atPath.replace('block/', 'blocks/');atPath=atPath.replace('item/', 'items/')}
  const root = getImageRoot(atPath, layoutName)
  img.src = patchPath(root + atPath) + '.png' // Set source path
  img.style.imageRendering = 'pixelated'
  // img.onload = function () {
  //   loadedImageBlobs[path] = this
  // }
  // For smithing table, use layout-specific key to avoid conflicts
  const cacheKey = (atPath === 'gui/container/smithing' && layoutName)
    ? `${atPath}_${layoutName}`
    : atPath
  loadedImageBlobs[cacheKey] = img
  return cacheKey
}

export function getImage (options) {
  let path = patchPath(options.path)

  // Try to get layoutId from global context (set by InventoryWindow during render)
  const layoutName = globalThis.currentLayoutId

  if (!path && options.with.startsWith('item.')) { // Temp to load image icons
    path = options.with.replace('.', '/')
    const cacheKey = loadRuntimeImage(path, layoutName)
    return loadedImageBlobs[cacheKey]
  }

  // For smithing table, use layout-specific key
  const cacheKey = (path === 'gui/container/smithing' && layoutName)
    ? `${path}_${layoutName}`
    : path

  if (!loadedImageBlobs[cacheKey]) {
    loadRuntimeImage(path, layoutName)
    // Update cacheKey if it was changed
    const newCacheKey = (path === 'gui/container/smithing' && layoutName)
      ? `${path}_${layoutName}`
      : path
    return loadedImageBlobs[newCacheKey]
  }

  return loadedImageBlobs[cacheKey]
}

loadAllImagesWeb()
