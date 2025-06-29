export default async function ({ addon, console, msg }) {
  const vm = addon.tab.traps.vm;
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  // Storage for workspace bookmarks
  let workspaceTabs = [];
  let categories = new Set(['General']);
  let collapsedCategories = new Set();
  let filteredBookmarks = [];
  let searchTerm = '';
  let isMenuOpen = false;

  // Constants for persistence
  const BOOKMARKS_STORAGE_KEY = 'workspaceBookmarks';
  const CATEGORIES_STORAGE_KEY = 'workspaceCategories';

  // Load bookmarks from project when it loads
  function loadBookmarksFromProject() {
    try {
      // Get the stage target to store bookmarks
      const stage = vm.runtime.getTargetForStage();
      if (stage && stage.comments) {
        // Look for our special bookmark storage comment
        for (const commentId in stage.comments) {
          const comment = stage.comments[commentId];
          if (comment.text && comment.text.startsWith('WORKSPACE_BOOKMARKS:')) {
            try {
              const bookmarksData = comment.text.replace('WORKSPACE_BOOKMARKS:', '');
              const data = JSON.parse(bookmarksData);
              if (data.bookmarks && Array.isArray(data.bookmarks)) {
                workspaceTabs = data.bookmarks;
                if (data.categories && Array.isArray(data.categories)) {
                  categories = new Set(data.categories);
                }
                if (data.collapsedCategories && Array.isArray(data.collapsedCategories)) {
                  collapsedCategories = new Set(data.collapsedCategories);
                }
                updateTabDisplay();
              }
            } catch (e) {
              console.warn('Failed to parse workspace bookmarks:', e);
            }
            break;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load workspace bookmarks:', e);
    }
  }

  // Save bookmarks to project
  function saveBookmarksToProject() {
    try {
      const stage = vm.runtime.getTargetForStage();
      if (!stage) return;

      // Find existing bookmark storage comment or create new one
      let bookmarkCommentId = null;
      for (const commentId in stage.comments) {
        const comment = stage.comments[commentId];
        if (comment.text && comment.text.startsWith('WORKSPACE_BOOKMARKS:')) {
          bookmarkCommentId = commentId;
          break;
        }
      }

      const bookmarksData = {
        bookmarks: workspaceTabs,
        categories: Array.from(categories),
        collapsedCategories: Array.from(collapsedCategories),
        version: '2.0',
        timestamp: Date.now()
      };
      const bookmarksJson = JSON.stringify(bookmarksData);
      const commentText = `WORKSPACE_BOOKMARKS:${bookmarksJson}`;

      if (bookmarkCommentId) {
        // Update existing comment
        stage.comments[bookmarkCommentId].text = commentText;
      } else {
        // Create new comment for bookmark storage
        void stage.createComment(
          null, // Let it generate an ID
          null, // Not attached to a block
          commentText,
          -1000, // Place it way off screen so it's not visible
          -1000,
          200,
          100,
          true // Minimized
        );
      }
      
      // Mark project as changed so it will be saved
      if (vm.runtime.emitProjectChanged) {
        vm.runtime.emitProjectChanged();
      }
    } catch (e) {
      console.warn('Failed to save workspace bookmarks:', e);
    }
  }

  // Import the custom bookmark icon and dropdown caret SVG used by File/Edit menus
  const bookmarkIconSvg = await import('./bookmark-icon.svg');
  const dropdownCaretSvg = await import('../../../components/menu-bar/dropdown-caret.svg');

  // Create the menu container following the exact pattern as File/Edit menus
  const menuContainer = document.createElement('div');
  menuContainer.className = addon.tab.scratchClass('menu-bar_menu-bar-item', 'menu-bar_hoverable') + ' sa-workspace-tabs-menu-container';

  // Add icon
  const menuIcon = document.createElement('img');
  menuIcon.src = bookmarkIconSvg.default || bookmarkIconSvg;
  menuIcon.draggable = false;
  menuIcon.width = 20;
  menuIcon.height = 20;
  
  // Add text
  const menuText = document.createElement('span');
  menuText.className = addon.tab.scratchClass('menu-bar_collapsible-label');
  menuText.textContent = msg('bookmarks');
  
  // Add caret
  const menuCaret = document.createElement('img');
  menuCaret.src = dropdownCaretSvg.default || dropdownCaretSvg;
  menuCaret.draggable = false;
  menuCaret.width = 8;
  menuCaret.height = 5;
  
  menuContainer.appendChild(menuIcon);
  menuContainer.appendChild(menuText);
  menuContainer.appendChild(menuCaret);

  // Create dropdown menu using the exact same structure as MenuBarMenu component
  const dropdownMenu = document.createElement('div');
  dropdownMenu.className = addon.tab.scratchClass('menu-bar_menu-bar-menu') + ' sa-workspace-tabs-dropdown';
  dropdownMenu.style.display = 'none';
  
  // Create menu content container - this is the actual <ul> menu element
  const menuContent = document.createElement('ul');
  menuContent.className = addon.tab.scratchClass('menu_menu', 'menu_right'); // Add right positioning class
  dropdownMenu.appendChild(menuContent);

  // The dropdown is a sibling to the menuContainer, not a child
  const menuWrapper = document.createElement('div');
  menuWrapper.className = 'sa-workspace-tabs-wrapper';
  menuWrapper.appendChild(menuContainer);
  menuWrapper.appendChild(dropdownMenu);

  // Search functionality
  function createSearchBar() {
    if (!addon.settings.get('showSearch')) return null;
    
    const searchContainer = document.createElement('div');
    searchContainer.className = 'sa-workspace-tabs-search-container';
    
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'sa-workspace-tabs-search-wrapper';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = msg('search-placeholder');
    searchInput.className = 'sa-workspace-tabs-search-input';
    
    const clearButton = document.createElement('button');
    clearButton.className = 'sa-workspace-tabs-search-clear';
    clearButton.innerHTML = '×';
    clearButton.title = 'Clear search';
    clearButton.style.display = 'none';
    
    // Prevent search input from losing focus
    searchInput.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    
    searchInput.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      searchInput.focus();
    });
    
    searchInput.addEventListener('focus', (e) => {
      e.stopPropagation();
    });
    
    searchInput.addEventListener('input', (e) => {
      e.stopPropagation();
      searchTerm = e.target.value.toLowerCase();
      
      // Show/hide clear button
      clearButton.style.display = searchTerm ? 'block' : 'none';
      
      updateBookmarkList(); // Use optimized update that preserves search bar
    });
    
    searchInput.addEventListener('keydown', (e) => {
      e.stopPropagation();
      // Allow Escape to close menu
      if (e.key === 'Escape') {
        closeMenu();
      }
    });
    
    // Clear button functionality
    clearButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      searchInput.value = '';
      searchTerm = '';
      clearButton.style.display = 'none';
      updateBookmarkList();
      searchInput.focus();
    });
    
    clearButton.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    
    // Prevent container clicks from affecting the input
    searchContainer.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    
    searchContainer.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    searchWrapper.appendChild(searchInput);
    searchWrapper.appendChild(clearButton);
    searchContainer.appendChild(searchWrapper);
    return searchContainer;
  }

  // Filter bookmarks based on search term
  function filterBookmarks() {
    if (!searchTerm) {
      filteredBookmarks = [...workspaceTabs];
      return;
    }
    
    filteredBookmarks = workspaceTabs.filter(bookmark => 
      bookmark.name.toLowerCase().includes(searchTerm) ||
      (bookmark.category && bookmark.category.toLowerCase().includes(searchTerm))
    );
  }

  // Optimized function to update only the bookmark list without recreating search bar
  function updateBookmarkList() {
    // Find existing search container and preserve it
    const existingSearch = menuContent.querySelector('.sa-workspace-tabs-search-container');
    
    // Remove ALL dynamic content except search bar
    const itemsToRemove = menuContent.querySelectorAll('li:not(:has(.sa-workspace-tabs-search-container)), .category-item, .sa-workspace-tabs-category-header, .empty-item, .sa-workspace-tabs-controls, .sa-workspace-tabs-menu-separator, .sa-workspace-tabs-category-content');
    itemsToRemove.forEach(item => {
      if (item.parentNode) {
        item.parentNode.removeChild(item);
      }
    });
    
    // Also remove any li elements that contain our dynamic content (but not search)
    Array.from(menuContent.children).forEach(child => {
      if (child.tagName === 'LI' && 
          !child.querySelector('.sa-workspace-tabs-search-container') &&
          (child.classList.contains('sa-workspace-tabs-menu-separator') ||
           child.querySelector('.sa-workspace-tabs-controls') ||
           child.querySelector('.sa-workspace-tabs-category-content') ||
           child.classList.contains('empty-item') ||
           child.classList.contains('category-item') ||
           child.classList.contains('add-bookmark-item'))) {
        child.remove();
      }
    });
    
    // Add "Add Bookmark" button at the top
    const addBookmarkItem = document.createElement('li');
    addBookmarkItem.className = addon.tab.scratchClass('menu_menu-item', 'menu_hoverable') + ' sa-workspace-tabs-menu-item add-bookmark-item';
    addBookmarkItem.textContent = msg('add-bookmark') || 'Add Bookmark';
    addBookmarkItem.addEventListener('click', (e) => {
      e.stopPropagation();
      addTab();
      closeMenu();
    });
    menuContent.appendChild(addBookmarkItem);
    
    // Filter bookmarks for search
    filterBookmarks();
    const bookmarksToShow = searchTerm ? filteredBookmarks : workspaceTabs;
    
    // Add separator if there are bookmarks
    if (bookmarksToShow.length > 0) {
      const separator = document.createElement('li');
      separator.className = addon.tab.scratchClass('menu_menu-section') + ' sa-workspace-tabs-menu-separator';
      menuContent.appendChild(separator);
    }
    
    // Add bookmark items (rest of the existing logic)
    if (addon.settings.get('enableCategories')) {
      // Group bookmarks by category
      const bookmarksByCategory = {};
      bookmarksToShow.forEach((bookmark, originalIndex) => {
        const category = bookmark.category || 'General';
        if (!bookmarksByCategory[category]) {
          bookmarksByCategory[category] = [];
        }
        bookmarksByCategory[category].push({ bookmark, originalIndex: workspaceTabs.indexOf(bookmark) });
      });
      
      // Sort categories
      const sortedCategories = Array.from(categories).sort();
      
      sortedCategories.forEach(categoryName => {
        if (!bookmarksByCategory[categoryName] || bookmarksByCategory[categoryName].length === 0) return;
        
        // Add category header
        const categoryHeader = createCategoryHeader(categoryName);
        menuContent.appendChild(categoryHeader);
        
        // Add category content container
        const categoryContent = document.createElement('div');
        categoryContent.className = 'sa-workspace-tabs-category-content';
        
        if (collapsedCategories.has(categoryName)) {
          categoryContent.classList.add('collapsed');
          categoryContent.style.maxHeight = '0';
        } else {
          categoryContent.style.maxHeight = 'none';
        }
        
        // Add bookmarks in this category
        bookmarksByCategory[categoryName].forEach(({ bookmark, originalIndex }) => {
          const menuItem = createMenuItem(bookmark, originalIndex);
          categoryContent.appendChild(menuItem);
        });
        
        // Wrap category content in a li element for proper menu structure
        const categoryWrapper = document.createElement('li');
        categoryWrapper.appendChild(categoryContent);
        menuContent.appendChild(categoryWrapper);
      });
    } else {
      // Show bookmarks without categories
      bookmarksToShow.forEach((bookmark) => {
        const originalIndex = workspaceTabs.indexOf(bookmark);
        const menuItem = createMenuItem(bookmark, originalIndex);
        menuContent.appendChild(menuItem);
      });
    }
    
    // Show empty state if no bookmarks
    if (bookmarksToShow.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = addon.tab.scratchClass('menu_menu-item') + ' sa-workspace-tabs-menu-item empty-item';
      emptyItem.textContent = searchTerm ? msg('no-matching-bookmarks') : msg('no-bookmarks');
      menuContent.appendChild(emptyItem);
    }
    
    // Add controls at bottom - wrap in li
    const controlsWrapper = document.createElement('li');
    controlsWrapper.className = 'sa-workspace-tabs-controls-wrapper';
    const controls = createControls();
    controlsWrapper.appendChild(controls);
    menuContent.appendChild(controlsWrapper);
  }

  // Category management
  function createCategoryHeader(categoryName) {
    const header = document.createElement('li');
    header.className = 'sa-workspace-tabs-category-header';
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = categoryName;
    
    const toggle = document.createElement('span');
    toggle.className = 'sa-workspace-tabs-category-toggle';
    toggle.textContent = '▼';
    
    if (collapsedCategories.has(categoryName)) {
      toggle.classList.add('collapsed');
    }
    
    header.addEventListener('click', () => {
      if (collapsedCategories.has(categoryName)) {
        collapsedCategories.delete(categoryName);
        toggle.classList.remove('collapsed');
      } else {
        collapsedCategories.add(categoryName);
        toggle.classList.add('collapsed');
      }
      updateMenuItems();
      saveBookmarksToProject();
    });
    
    header.appendChild(nameSpan);
    header.appendChild(toggle);
    
    return header;
  }

  // Import/Export functionality
  function exportBookmarks() {
    const data = {
      bookmarks: workspaceTabs,
      categories: Array.from(categories),
      version: '2.0',
      exportDate: new Date().toISOString(),
      projectName: vm.runtime.getTargetForStage()?.getName() || 'Scratch Project'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `workspace-bookmarks-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    closeMenu();
  }

  function importBookmarks() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          
          if (data.bookmarks && Array.isArray(data.bookmarks)) {
            const importCount = data.bookmarks.length;
            
            // Merge bookmarks, avoiding duplicates
            data.bookmarks.forEach(bookmark => {
              const exists = workspaceTabs.some(existing => 
                existing.name === bookmark.name && 
                JSON.stringify(existing.state) === JSON.stringify(bookmark.state)
              );
              
              if (!exists) {
                if (!bookmark.category) bookmark.category = 'General';
                workspaceTabs.push(bookmark);
                categories.add(bookmark.category);
              }
            });
            
            if (data.categories && Array.isArray(data.categories)) {
              data.categories.forEach(cat => categories.add(cat));
            }
            
            updateTabDisplay();
            saveBookmarksToProject();
            
            alert(msg('import-success', {count: importCount}));
          } else {
            alert(msg('import-error'));
          }
        } catch (error) {
          console.error('Failed to import bookmarks:', error);
          alert('Failed to import bookmarks. Please check the file format.');
        }
      };
      
      reader.readAsText(file);
    });
    
    input.click();
    closeMenu();
  }

  function clearAllBookmarks() {
    if (workspaceTabs.length === 0) return;
    
    if (confirm(msg('clear-all-confirm', {count: workspaceTabs.length}))) {
      workspaceTabs = [];
      categories = new Set(['General']);
      collapsedCategories.clear();
      updateTabDisplay();
      saveBookmarksToProject();
    }
    closeMenu();
  }

  // Create import/export controls
  function createControls() {
    const controls = document.createElement('div');
    controls.className = 'sa-workspace-tabs-controls';
    
    const exportBtn = document.createElement('button');
    exportBtn.className = 'sa-workspace-tabs-control-button';
    exportBtn.textContent = msg('export');
    exportBtn.title = msg('export-tooltip');
    exportBtn.addEventListener('click', exportBookmarks);
    
    const importBtn = document.createElement('button');
    importBtn.className = 'sa-workspace-tabs-control-button';
    importBtn.textContent = msg('import');
    importBtn.title = msg('import-tooltip');
    importBtn.addEventListener('click', importBookmarks);
    
    const clearBtn = document.createElement('button');
    clearBtn.className = 'sa-workspace-tabs-control-button';
    clearBtn.textContent = msg('clear-all');
    clearBtn.title = msg('clear-all-tooltip');
    clearBtn.addEventListener('click', clearAllBookmarks);
    
    controls.appendChild(exportBtn);
    controls.appendChild(importBtn);
    controls.appendChild(clearBtn);
    
    return controls;
  }

  // Menu interaction handlers
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    dropdownMenu.style.display = isMenuOpen ? 'block' : 'none';
    menuContainer.classList.toggle('active', isMenuOpen);
    
    if (isMenuOpen) {
      updateMenuItems();
      // Close menu when clicking outside
      document.addEventListener('click', handleOutsideClick, true);
    } else {
      document.removeEventListener('click', handleOutsideClick, true);
    }
  }

  function handleOutsideClick(e) {
    // Don't close if clicking on search input or its container
    if (e.target.closest('.sa-workspace-tabs-search-container') ||
        e.target.closest('.sa-workspace-tabs-search-input')) {
      return;
    }
    
    // Don't close if clicking anywhere inside the menu wrapper
    if (!menuWrapper.contains(e.target)) {
      closeMenu();
    }
  }

  function closeMenu() {
    isMenuOpen = false;
    dropdownMenu.style.display = 'none';
    menuContainer.classList.remove('active');
    document.removeEventListener('click', handleOutsideClick, true);
  }

  // Menu container click handler
  const handleMenuClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggleMenu();
  };

  // Add click handler for menu toggle
  menuContainer.addEventListener('click', handleMenuClick);

  // Function to create menu item
  function createMenuItem(tab, index) {
    const menuItem = document.createElement('li');
    menuItem.className = addon.tab.scratchClass('menu_menu-item', 'menu_hoverable') + ' sa-workspace-tabs-menu-item category-item';
    
    const itemContent = document.createElement('div');
    itemContent.className = 'sa-workspace-tabs-item-content';
    
    const itemMain = document.createElement('div');
    itemMain.className = 'sa-workspace-tabs-item-main';
    
    const itemText = document.createElement('div');
    itemText.className = 'sa-workspace-tabs-item-text';
    itemText.textContent = tab.name;
    itemText.title = `Switch to ${tab.name}`;
    
    // Add metadata if available
    if (tab.timestamp) {
      const meta = document.createElement('span');
      meta.className = 'sa-workspace-tabs-bookmark-meta';
      const date = new Date(tab.timestamp);
      meta.textContent = ` (${date.toLocaleDateString()})`;
      itemText.appendChild(meta);
    }
    
    itemMain.appendChild(itemText);
    itemContent.appendChild(itemMain);
    
    // Create button container for edit and delete buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'sa-workspace-tabs-button-container';
    
    // Create edit button
    const editButton = document.createElement('button');
    editButton.className = 'sa-workspace-tabs-item-edit';
    editButton.innerHTML = '📝';
    editButton.title = 'Edit bookmark';
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'sa-workspace-tabs-item-delete';
    deleteButton.innerHTML = '×';
    deleteButton.title = 'Delete bookmark';
    
    menuItem.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target === deleteButton) {
        deleteTab(index);
      } else if (e.target === editButton) {
        editTab(index);
      } else {
        switchToTab(index);
        closeMenu();
      }
    });
    
    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTab(index);
    });
    
    editButton.addEventListener('click', (e) => {
      e.stopPropagation();
      editTab(index);
    });
    
    buttonContainer.appendChild(editButton);
    buttonContainer.appendChild(deleteButton);
    itemContent.appendChild(buttonContainer);
    menuItem.appendChild(itemContent);
    
    return menuItem;
  }

  // Function to update menu items (full rebuild)
  function updateMenuItems() {
    // Check if search bar already exists and preserve its state
    const existingSearchInput = menuContent.querySelector('.sa-workspace-tabs-search-input');
    
    if (existingSearchInput) {
      // If search bar exists, just update the bookmark list to avoid focus loss
      updateBookmarkList();
      return;
    }
    
    // Full rebuild only when search bar doesn't exist (initial load)
    menuContent.innerHTML = '';
    
    // Add search bar if enabled
    if (addon.settings.get('showSearch')) {
      const searchBar = createSearchBar();
      if (searchBar) {
        menuContent.appendChild(searchBar);
      }
    }
    
    // Use the optimized bookmark list update
    updateBookmarkList();
  }

  // Create add bookmark button - keeping for compatibility but hiding
  const addTabButton = document.createElement('button');
  addTabButton.className = 'sa-workspace-tabs-add';
  addTabButton.innerHTML = '+';
  addTabButton.title = msg('add-bookmark-tooltip');
  addTabButton.style.display = 'none'; // Hide the old add button

  // Function to get current workspace state
  function getCurrentWorkspaceState() {
    const workspace = ScratchBlocks.getMainWorkspace();
    if (!workspace) return null;

    const metrics = workspace.getMetrics();
    const currentTarget = vm.editingTarget;
    
    return {
      scrollX: metrics.viewLeft,
      scrollY: metrics.viewTop,
      scale: workspace.scale,
      targetId: currentTarget ? currentTarget.id : null
    };
  }

  // Function to apply workspace state
  function applyWorkspaceState(state) {
    if (!state) return;

    // Switch to the target sprite first
    if (state.targetId && state.targetId !== vm.editingTarget?.id) {
      const target = vm.runtime.getTargetById(state.targetId);
      if (target) {
        vm.setEditingTarget(state.targetId);
      }
    }

    // Apply workspace position and scale
    const workspace = ScratchBlocks.getMainWorkspace();
    if (workspace && workspace.scrollbar) {
      // Set scale first
      workspace.setScale(state.scale);
      
      // Then set scroll position
      const scrollX = state.scrollX - workspace.getMetrics().contentLeft;
      const scrollY = state.scrollY - workspace.getMetrics().contentTop;
      workspace.scrollbar.set(scrollX, scrollY);
    }
  }

  // Function to create a tab button
  function createTabButton(tab, index) {
    const button = document.createElement('button');
    button.className = 'sa-workspace-tabs-tab';
    button.dataset.index = index;
    
    const content = document.createElement('div');
    content.className = 'sa-workspace-tabs-tab-content';
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'sa-workspace-tabs-tab-name';
    nameSpan.textContent = tab.name;
    nameSpan.contentEditable = false;
    nameSpan.spellcheck = false;
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'sa-workspace-tabs-tab-delete';
    deleteButton.innerHTML = '×';
    deleteButton.title = 'Delete bookmark';
    
    content.appendChild(nameSpan);
    if (addon.settings.get('showNumbers')) {
      const numberSpan = document.createElement('span');
      numberSpan.className = 'sa-workspace-tabs-tab-number';
      numberSpan.textContent = (index + 1);
      content.insertBefore(numberSpan, nameSpan);
    }
    content.appendChild(deleteButton);
    
    button.appendChild(content);
    
    // Event listeners
    button.addEventListener('click', (e) => {
      if (e.target === deleteButton) {
        e.stopPropagation();
        deleteTab(index);
      } else if (e.target === nameSpan) {
        e.stopPropagation();
        // Single click - just switch to tab
        switchToTab(index);
      } else {
        switchToTab(index);
      }
    });
    
    // Double-click to edit name
    nameSpan.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      nameSpan.contentEditable = true;
      nameSpan.focus();
      // Select all text for easy editing
      const range = document.createRange();
      range.selectNodeContents(nameSpan);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
    
    nameSpan.addEventListener('blur', () => {
      nameSpan.contentEditable = false;
      tab.name = nameSpan.textContent.trim() || `Bookmark ${index + 1}`;
      nameSpan.textContent = tab.name;
    });
    
    nameSpan.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        nameSpan.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        nameSpan.textContent = tab.name; // Restore original name
        nameSpan.blur();
      }
    });
    
    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTab(index);
    });
    
    return button;
  }

  // Function to add a new bookmark
  function addTab() {
    if (workspaceTabs.length >= addon.settings.get('maxTabs')) {
      alert(`Maximum number of bookmarks reached (${addon.settings.get('maxTabs')})`);
      return;
    }

    const state = getCurrentWorkspaceState();
    if (!state) return;

    // Simple prompt for bookmark details
    const name = prompt(msg('bookmark-name'), `Bookmark ${workspaceTabs.length + 1}`);
    if (name === null) return;
    
    let category = 'General';
    if (addon.settings.get('enableCategories')) {
      const categoryList = Array.from(categories).join(', ');
      const categoryInput = prompt(msg('category', {categories: categoryList}), 'General');
      if (categoryInput === null) return;
      category = categoryInput.trim() || 'General';
      categories.add(category);
    }

    const tab = {
      name: name.trim() || `Bookmark ${workspaceTabs.length + 1}`,
      category: category,
      state: state,
      timestamp: Date.now()
    };

    workspaceTabs.push(tab);
    updateTabDisplay();
    saveBookmarksToProject();
  }

  // Function to switch to a bookmark
  function switchToTab(index) {
    if (index < 0 || index >= workspaceTabs.length) return;
    
    const tab = workspaceTabs[index];
    applyWorkspaceState(tab.state);
    // Don't update currentTabIndex or show selection
  }

  // Function to delete a bookmark
  function deleteTab(index) {
    if (index < 0 || index >= workspaceTabs.length) return;
    
    workspaceTabs.splice(index, 1);
    updateTabDisplay();
    saveBookmarksToProject(); // Save to project
  }

  // Function to edit a bookmark name
  function editTab(index) {
    if (index < 0 || index >= workspaceTabs.length) return;
    
    const bookmark = workspaceTabs[index];
    const currentName = bookmark.name;
    const newName = prompt(msg('bookmark-name'), currentName);
    
    if (newName !== null && newName.trim() !== '' && newName !== currentName) {
      bookmark.name = newName.trim();
      
      if (addon.settings.get('enableCategories')) {
        const categoryList = Array.from(categories).join(', ');
        const currentCategory = bookmark.category || 'General';
        const newCategory = prompt(msg('category', {categories: categoryList}), currentCategory);
        
        if (newCategory !== null) {
          const categoryName = newCategory.trim() || 'General';
          bookmark.category = categoryName;
          categories.add(categoryName);
        }
      }
      
      updateTabDisplay();
      saveBookmarksToProject();
    }
    
    // Close menu after editing
    closeMenu();
  }

  // Function to update the bookmark display
  function updateTabDisplay() {
    // Update menu items when dropdown is open
    if (isMenuOpen) {
      updateMenuItems();
    }
    
    // Update menu text to show count
    const count = workspaceTabs.length;
    menuText.textContent = count > 0 ? `Bookmarks (${count})` : 'Bookmarks';
  }

  // Event listeners
  addTabButton.addEventListener('click', addTab);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (!addon.self.disabled && e.ctrlKey && e.altKey) {
      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        switchToTab(index);
      } else if (e.key === '0') {
        e.preventDefault();
        switchToTab(9); // Tab 10
      } else if (e.key === 't') {
        e.preventDefault();
        addTab();
      }
    }
  });

  // Settings change listener
  addon.settings.addEventListener('change', () => {
    updateTabDisplay();
  });

  // Project change listeners - load bookmarks from project
  vm.runtime.on('PROJECT_LOADED', () => {
    // Load bookmarks from the new project
    loadBookmarksFromProject();
  });

  // Function to clear all bookmarks
  function clearAllBookmarks() {
    workspaceTabs = [];
    updateTabDisplay();
  }

  // Function to set up workspace change tracking and cleanup
  function setupWorkspaceTracking() {
    // Clear bookmarks when page is unloaded
    window.addEventListener('beforeunload', () => {
      clearAllBookmarks();
    });

    // Clear bookmarks when navigating away from editor
    window.addEventListener('pagehide', () => {
      clearAllBookmarks();
    });
  }

  // Initialize the addon
  while (true) {
    const menuBar = await addon.tab.waitForElement('[class*="menu-bar_menu-bar"]', {
      markAsSeen: true,
      reduxEvents: [
        "scratch-gui/mode/SET_PLAYER",
        "fontsLoaded/SET_FONTS_LOADED",
        "scratch-gui/locales/SELECT_LOCALE",
      ],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });

    if (addon.self.disabled) {
      continue;
    }

    // Add the menu wrapper to the menu bar
    addon.tab.displayNoneWhileDisabled(menuWrapper, { display: "flex" });
    
    const divider = menuBar.querySelector('[class*="menu-bar_divider"]');
    
    let success = false;
    
    if (divider && divider.parentNode) {
      // Insert before the divider if main menu approach failed
      divider.parentNode.insertBefore(menuWrapper, divider);
      success = true;
    }
    
    if (!success) {
      // Fallback: append to menu bar directly
      menuBar.appendChild(menuWrapper);
      success = true;
    }
    
    if (success) {
      // Set up workspace change tracking
      setupWorkspaceTracking();
      
      // Initialize the display
      updateTabDisplay();
    }
    
    break;
  }
}
