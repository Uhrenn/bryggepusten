/* ============================================
   BRYGGEPUSTEN — Home Brew Tracker App
   All data stored in localStorage
   ============================================ */

const app = {
    data: {
        recipes: [],
        brews: [],
        ingredients: [],
    },

    // Current state
    currentView: 'dashboard',
    currentIngredientTab: 'malts',
    currentBrewFilter: 'all',

    // Status labels in Norwegian
    statusLabels: {
        planning: 'Planlegging',
        brewing: 'Brygging',
        fermenting: 'Gjæring',
        conditioning: 'Kondisjonering',
        bottled: 'Tappet',
        drinking: 'Drikkes',
    },

    statusOrder: ['planning', 'brewing', 'fermenting', 'conditioning', 'bottled', 'drinking'],

    logTypeLabels: {
        mesking: 'Mesking',
        kok: 'Kok',
        humleting: 'Humletilsetting',
        kjøling: 'Kjøling',
        gjæring: 'Gjæring',
        tapping: 'Tapping',
        smaking: 'Smaking',
        måling: 'Måling',
        annen: 'Annet',
    },

    // ============================================
    // INIT
    // ============================================
    init() {
        this.loadData();
        this.bindNavEvents();
        this.renderAll();
        this.seedDemoDataIfEmpty();
    },

    loadData() {
        try {
            const saved = localStorage.getItem('bryggepusten-data');
            if (saved) {
                this.data = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load data:', e);
        }
    },

    saveData() {
        try {
            localStorage.setItem('bryggepusten-data', JSON.stringify(this.data));
        } catch (e) {
            console.error('Failed to save data:', e);
        }
    },

    // ============================================
    // NAVIGATION
    // ============================================
    bindNavEvents() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.showView(view);
            });
        });
    },

    showView(viewName) {
        this.currentView = viewName;

        // Update nav
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });

        // Show/hide views
        document.querySelectorAll('.view').forEach(v => {
            v.classList.toggle('active', v.id === `view-${viewName}`);
        });

        this.renderAll();
    },

    // ============================================
    // RENDER
    // ============================================
    renderAll() {
        switch (this.currentView) {
            case 'dashboard': this.renderDashboard(); break;
            case 'recipes': this.renderRecipes(); break;
            case 'brews': this.renderBrews(); break;
            case 'ingredients': this.renderIngredients(); break;
        }
    },

    // -- Dashboard --
    renderDashboard() {
        const totalRecipes = this.data.recipes.length;
        const totalBrews = this.data.brews.length;
        const activeBrews = this.data.brews.filter(b => !['drinking'].includes(b.status));
        const drinkingBrews = this.data.brews.filter(b => b.status === 'drinking');
        const totalIngredients = this.data.ingredients.length;

        // Stats
        const statsGrid = document.getElementById('stats-grid');
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${totalRecipes}</div>
                <div class="stat-label">Oppskrifter</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalBrews}</div>
                <div class="stat-label">Totalt brygg</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${activeBrews.length}</div>
                <div class="stat-label">Aktive brygg</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${drinkingBrews.length}</div>
                <div class="stat-label">Klar til drikking</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalIngredients}</div>
                <div class="stat-label">Ingredienser</div>
            </div>
        `;

        // Active brews
        const activeGrid = document.getElementById('active-brews-grid');
        if (activeBrews.length === 0) {
            activeGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🫧</div>
                    <h4>Ingen aktive brygg</h4>
                    <p>Start et nytt brygg for å holde styr på fremgangen din.</p>
                </div>`;
        } else {
            activeGrid.innerHTML = activeBrews.slice(0, 4).map(b => this.brewCardHTML(b)).join('');
        }

        // Recent recipes
        const recipeGrid = document.getElementById('recent-recipes-grid');
        const recentRecipes = [...this.data.recipes].reverse().slice(0, 4);
        if (recentRecipes.length === 0) {
            recipeGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚒</div>
                    <h4>Ingen oppskrifter ennå</h4>
                    <p>Legg til din første oppskrift for å komme i gang.</p>
                </div>`;
        } else {
            recipeGrid.innerHTML = recentRecipes.map(r => this.recipeCardHTML(r)).join('');
        }
    },

    // -- Recipes --
    renderRecipes() {
        this.renderRecipeStyleFilters();
        this.renderRecipeList();
    },

    renderRecipeStyleFilters() {
        const styles = [...new Set(this.data.recipes.map(r => r.style))].sort();
        const container = document.getElementById('recipe-style-filters');
        container.innerHTML = `
            <button class="chip active" onclick="app.filterRecipesByStyle('all', this)">Alle</button>
            ${styles.map(s => `<button class="chip" onclick="app.filterRecipesByStyle('${s}', this)">${s}</button>`).join('')}
        `;
    },

    _recipeStyleFilter: 'all',

    filterRecipesByStyle(style, btn) {
        this._recipeStyleFilter = style;
        document.querySelectorAll('#recipe-style-filters .chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        this.renderRecipeList();
    },

    filterRecipes() {
        this.renderRecipeList();
    },

    renderRecipeList() {
        const searchVal = (document.getElementById('recipe-search')?.value || '').toLowerCase();
        let recipes = [...this.data.recipes];

        if (this._recipeStyleFilter !== 'all') {
            recipes = recipes.filter(r => r.style === this._recipeStyleFilter);
        }

        if (searchVal) {
            recipes = recipes.filter(r =>
                r.name.toLowerCase().includes(searchVal) ||
                r.style.toLowerCase().includes(searchVal) ||
                (r.notes || '').toLowerCase().includes(searchVal)
            );
        }

        const container = document.getElementById('recipe-list');
        if (recipes.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1">
                    <div class="empty-state-icon">⚒</div>
                    <h4>Ingen oppskrifter</h4>
                    <p>Opprett din første oppskrift for å komme i gang med bryggingen.</p>
                </div>`;
        } else {
            container.innerHTML = recipes.map(r => this.recipeCardHTML(r)).join('');
        }
    },

    recipeCardHTML(recipe) {
        const brewCount = this.data.brews.filter(b => b.recipeId === recipe.id).length;
        return `
            <div class="recipe-card" onclick="app.editRecipe('${recipe.id}')">
                <div class="recipe-card-header">
                    <div>
                        <div class="recipe-card-name">${this.esc(recipe.name)}</div>
                        <div class="recipe-card-style"><span class="style-badge">${this.esc(recipe.style)}</span></div>
                    </div>
                    <button class="btn-icon danger" onclick="event.stopPropagation(); app.deleteRecipe('${recipe.id}')" title="Slett">🗑</button>
                </div>
                <div class="recipe-card-stats">
                    ${recipe.og ? `<div class="recipe-stat"><div class="recipe-stat-value">${this.esc(recipe.og)}</div><div class="recipe-stat-label">OG</div></div>` : ''}
                    ${recipe.fg ? `<div class="recipe-stat"><div class="recipe-stat-value">${this.esc(recipe.fg)}</div><div class="recipe-stat-label">FG</div></div>` : ''}
                    ${recipe.ibu ? `<div class="recipe-stat"><div class="recipe-stat-value">${recipe.ibu}</div><div class="recipe-stat-label">IBU</div></div>` : ''}
                    ${recipe.abv ? `<div class="recipe-stat"><div class="recipe-stat-value">${recipe.abv}%</div><div class="recipe-stat-label">ABV</div></div>` : ''}
                    ${recipe.batchSize ? `<div class="recipe-stat"><div class="recipe-stat-value">${recipe.batchSize}L</div><div class="recipe-stat-label">Batcstr.</div></div>` : ''}
                    <div class="recipe-stat"><div class="recipe-stat-value">${brewCount}</div><div class="recipe-stat-label">Brygg</div></div>
                </div>
            </div>`;
    },

    // -- Brews --
    renderBrews() {
        this.renderBrewTimeline();
    },

    filterBrews(filter, btn) {
        this.currentBrewFilter = filter;
        document.querySelectorAll('#brew-status-filters .chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        this.renderBrewTimeline();
    },

    renderBrewTimeline() {
        let brews = [...this.data.brews].sort((a, b) => new Date(b.date) - new Date(a.date));

        if (this.currentBrewFilter !== 'all') {
            brews = brews.filter(b => b.status === this.currentBrewFilter);
        }

        const container = document.getElementById('brew-timeline');
        if (brews.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🫧</div>
                    <h4>Ingen brygg</h4>
                    <p>Start ditt første brygg for å spore fremgangen.</p>
                </div>`;
        } else {
            container.innerHTML = brews.map(b => this.brewCardHTML(b)).join('');
        }
    },

    brewCardHTML(brew) {
        const recipe = this.data.recipes.find(r => r.id === brew.recipeId);
        const recipeName = recipe ? recipe.name : '';
        const statusIdx = this.statusOrder.indexOf(brew.status);

        return `
            <div class="brew-card" onclick="app.openBrewDetail('${brew.id}')">
                <div class="brew-timeline-dot" style="color: var(--status-${brew.status}); background: var(--status-${brew.status})"></div>
                <div class="brew-card-content">
                    <div class="brew-card-header">
                        <div class="brew-card-name">${this.esc(brew.name)}</div>
                        <span class="status-badge status-${brew.status}">${this.statusLabels[brew.status]}</span>
                    </div>
                    ${recipeName ? `<div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:0.3rem">Oppskrift: ${this.esc(recipeName)}</div>` : ''}
                    <div class="brew-card-meta">
                        <span>📅 ${this.formatDate(brew.date)}</span>
                        ${brew.og ? `<span class="mono">OG ${this.esc(brew.og)}</span>` : ''}
                        ${brew.fg ? `<span class="mono">FG ${this.esc(brew.fg)}</span>` : ''}
                        ${brew.volume ? `<span>🧪 ${brew.volume}L</span>` : ''}
                    </div>
                    <div class="brew-progress">
                        ${this.statusOrder.map((s, i) => `
                            <div class="brew-progress-step ${i < statusIdx ? 'completed' : ''} ${i === statusIdx ? 'current' : ''}"></div>
                        `).join('')}
                    </div>
                </div>
            </div>`;
    },

    // -- Ingredients --
    renderIngredients() {
        this.renderIngredientTable();
    },

    switchIngredientTab(tab, btn) {
        this.currentIngredientTab = tab;
        document.querySelectorAll('.ingredients-tabs .tab-btn').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        this.renderIngredientTable();
    },

    renderIngredientTable() {
        const tab = this.currentIngredientTab;
        const items = this.data.ingredients.filter(i => i.type === tab);
        const container = document.getElementById('ingredients-content');

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🧶</div>
                    <h4>Ingen ${tab === 'malts' ? 'malt' : tab === 'hops' ? 'humle' : tab === 'yeast' ? 'gjær' : 'ingredienser'}</h4>
                    <p>Legg til ingredienser for å bygge opp lageret ditt.</p>
                </div>`;
            return;
        }

        const isHop = tab === 'hops';
        const isMalt = tab === 'malts';

        container.innerHTML = `
            <table class="ingredient-table">
                <thead>
                    <tr>
                        <th>Navn</th>
                        <th>Mengde</th>
                        ${isMalt ? '<th>EBC</th>' : ''}
                        ${isHop ? '<th>Alfa-syre %</th>' : ''}
                        <th>Leverandør</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(i => `
                        <tr>
                            <td class="ing-name">${this.esc(i.name)}</td>
                            <td>${this.esc(i.amount || '—')}</td>
                            ${isMalt ? `<td>${i.color || '—'}</td>` : ''}
                            ${isHop ? `<td>${i.alpha || '—'}</td>` : ''}
                            <td>${this.esc(i.supplier || '—')}</td>
                            <td class="ingredient-actions">
                                <button class="btn-icon" onclick="app.editIngredient('${i.id}')" title="Rediger">✎</button>
                                <button class="btn-icon danger" onclick="app.deleteIngredient('${i.id}')" title="Slett">🗑</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
    },

    // ============================================
    // RECIPE CRUD
    // ============================================
    openRecipeModal(recipeId = null) {
        const modal = document.getElementById('recipe-modal');
        const form = document.getElementById('recipe-form');
        const title = document.getElementById('recipe-modal-title');

        form.reset();
        document.getElementById('recipe-id').value = '';
        document.getElementById('recipe-malts-list').innerHTML = '';
        document.getElementById('recipe-hops-list').innerHTML = '';
        document.getElementById('recipe-yeast-list').innerHTML = '';

        if (recipeId) {
            const recipe = this.data.recipes.find(r => r.id === recipeId);
            if (recipe) {
                title.textContent = 'Rediger oppskrift';
                document.getElementById('recipe-id').value = recipe.id;
                document.getElementById('recipe-name').value = recipe.name;
                document.getElementById('recipe-style').value = recipe.style;
                document.getElementById('recipe-batch-size').value = recipe.batchSize || 20;
                document.getElementById('recipe-og').value = recipe.og || '';
                document.getElementById('recipe-fg').value = recipe.fg || '';
                document.getElementById('recipe-ibu').value = recipe.ibu || '';
                document.getElementById('recipe-abv').value = recipe.abv || '';
                document.getElementById('recipe-srm').value = recipe.srm || '';
                document.getElementById('recipe-mash-temp').value = recipe.mashTemp || '';
                document.getElementById('recipe-mash-time').value = recipe.mashTime || '';
                document.getElementById('recipe-boil-time').value = recipe.boilTime || 60;
                document.getElementById('recipe-notes').value = recipe.notes || '';

                // Populate ingredients
                (recipe.malts || []).forEach(m => this.addRecipeIngredientRow('malts', m));
                (recipe.hops || []).forEach(h => this.addRecipeIngredientRow('hops', h));
                (recipe.yeast || []).forEach(y => this.addRecipeIngredientRow('yeast', y));
            }
        } else {
            title.textContent = 'Ny oppskrift';
        }

        modal.classList.add('active');
    },

    addRecipeIngredientRow(type, data = {}) {
        const listId = `recipe-${type}-list`;
        const list = document.getElementById(listId);
        const row = document.createElement('div');
        row.className = 'ingredient-row';
        const id = `ing-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

        if (type === 'yeast') {
            row.innerHTML = `
                <input type="text" placeholder="Gjærtype" value="${this.esc(data.name || '')}" data-field="name">
                <input type="text" placeholder="Mengde" value="${this.esc(data.amount || '')}" data-field="amount">
                <span></span>
                <button type="button" class="btn-icon danger" onclick="this.parentElement.remove()" title="Fjern">✕</button>
            `;
        } else if (type === 'hops') {
            row.innerHTML = `
                <input type="text" placeholder="Humlesort" value="${this.esc(data.name || '')}" data-field="name">
                <input type="text" placeholder="Mengde" value="${this.esc(data.amount || '')}" data-field="amount">
                <input type="text" placeholder="Tid (min)" value="${this.esc(data.time || '')}" data-field="time">
                <button type="button" class="btn-icon danger" onclick="this.parentElement.remove()" title="Fjern">✕</button>
            `;
        } else {
            row.innerHTML = `
                <input type="text" placeholder="Maltsort" value="${this.esc(data.name || '')}" data-field="name">
                <input type="text" placeholder="Mengde" value="${this.esc(data.amount || '')}" data-field="amount">
                <input type="text" placeholder="EBC" value="${this.esc(data.color || '')}" data-field="color">
                <button type="button" class="btn-icon danger" onclick="this.parentElement.remove()" title="Fjern">✕</button>
            `;
        }

        list.appendChild(row);
    },

    getRecipeIngredients(type) {
        const list = document.getElementById(`recipe-${type}-list`);
        const rows = list.querySelectorAll('.ingredient-row');
        return Array.from(rows).map(row => {
            const item = {};
            row.querySelectorAll('input').forEach(input => {
                if (input.dataset.field) {
                    item[input.dataset.field] = input.value.trim();
                }
            });
            return item;
        }).filter(item => item.name);
    },

    saveRecipe(e) {
        e.preventDefault();
        const id = document.getElementById('recipe-id').value || this.generateId();
        const isEdit = !!document.getElementById('recipe-id').value;

        const recipe = {
            id,
            name: document.getElementById('recipe-name').value.trim(),
            style: document.getElementById('recipe-style').value,
            batchSize: parseFloat(document.getElementById('recipe-batch-size').value) || 20,
            og: document.getElementById('recipe-og').value.trim(),
            fg: document.getElementById('recipe-fg').value.trim(),
            ibu: parseInt(document.getElementById('recipe-ibu').value) || null,
            abv: parseFloat(document.getElementById('recipe-abv').value) || null,
            srm: parseInt(document.getElementById('recipe-srm').value) || null,
            mashTemp: parseInt(document.getElementById('recipe-mash-temp').value) || null,
            mashTime: parseInt(document.getElementById('recipe-mash-time').value) || null,
            boilTime: parseInt(document.getElementById('recipe-boil-time').value) || 60,
            malts: this.getRecipeIngredients('malts'),
            hops: this.getRecipeIngredients('hops'),
            yeast: this.getRecipeIngredients('yeast'),
            notes: document.getElementById('recipe-notes').value.trim(),
            createdAt: isEdit ? (this.data.recipes.find(r => r.id === id)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (isEdit) {
            const idx = this.data.recipes.findIndex(r => r.id === id);
            if (idx !== -1) this.data.recipes[idx] = recipe;
        } else {
            this.data.recipes.push(recipe);
        }

        this.saveData();
        this.closeModal('recipe-modal');
        this.renderAll();
        this.toast(isEdit ? 'Oppskrift oppdatert!' : 'Oppskrift lagret!', 'success');
    },

    editRecipe(id) {
        this.openRecipeModal(id);
    },

    deleteRecipe(id) {
        if (!confirm('Er du sikker på at du vil slette denne oppskriften?')) return;
        this.data.recipes = this.data.recipes.filter(r => r.id !== id);
        this.saveData();
        this.renderAll();
        this.toast('Oppskrift slettet', 'info');
    },

    // ============================================
    // BREW CRUD
    // ============================================
    openBrewModal(brewId = null) {
        const modal = document.getElementById('brew-modal');
        const form = document.getElementById('brew-form');
        const title = document.getElementById('brew-modal-title');

        form.reset();
        document.getElementById('brew-id').value = '';

        // Populate recipe dropdown
        const recipeSelect = document.getElementById('brew-recipe');
        recipeSelect.innerHTML = `<option value="">Uten oppskrift</option>` +
            this.data.recipes.map(r => `<option value="${r.id}">${this.esc(r.name)}</option>`).join('');

        // Set default date to today
        document.getElementById('brew-date').value = new Date().toISOString().split('T')[0];

        if (brewId) {
            const brew = this.data.brews.find(b => b.id === brewId);
            if (brew) {
                title.textContent = 'Rediger brygg';
                document.getElementById('brew-id').value = brew.id;
                document.getElementById('brew-name').value = brew.name;
                document.getElementById('brew-recipe').value = brew.recipeId || '';
                document.getElementById('brew-status').value = brew.status;
                document.getElementById('brew-date').value = brew.date;
                document.getElementById('brew-og').value = brew.og || '';
                document.getElementById('brew-fg').value = brew.fg || '';
                document.getElementById('brew-volume').value = brew.volume || '';
                document.getElementById('brew-efficiency').value = brew.efficiency || '';
                document.getElementById('brew-notes').value = brew.notes || '';
            }
        } else {
            title.textContent = 'Nytt brygg';
            // Suggest brew number
            const nextNum = this.data.brews.length + 1;
            document.getElementById('brew-name').value = `Brygg #${nextNum}`;
        }

        modal.classList.add('active');
    },

    saveBrew(e) {
        e.preventDefault();
        const id = document.getElementById('brew-id').value || this.generateId();
        const isEdit = !!document.getElementById('brew-id').value;

        const brew = {
            id,
            name: document.getElementById('brew-name').value.trim(),
            recipeId: document.getElementById('brew-recipe').value || null,
            status: document.getElementById('brew-status').value,
            date: document.getElementById('brew-date').value,
            og: document.getElementById('brew-og').value.trim(),
            fg: document.getElementById('brew-fg').value.trim(),
            volume: parseFloat(document.getElementById('brew-volume').value) || null,
            efficiency: parseInt(document.getElementById('brew-efficiency').value) || null,
            notes: document.getElementById('brew-notes').value.trim(),
            log: isEdit ? (this.data.brews.find(b => b.id === id)?.log || []) : [],
            createdAt: isEdit ? (this.data.brews.find(b => b.id === id)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (isEdit) {
            const idx = this.data.brews.findIndex(b => b.id === id);
            if (idx !== -1) this.data.brews[idx] = brew;
        } else {
            this.data.brews.push(brew);
        }

        this.saveData();
        this.closeModal('brew-modal');
        this.renderAll();
        this.toast(isEdit ? 'Brygg oppdatert!' : 'Brygg lagret!', 'success');
    },

    deleteBrew(id) {
        if (!confirm('Er du sikker på at du vil slette dette brygget og alle loggpostene?')) return;
        this.data.brews = this.data.brews.filter(b => b.id !== id);
        this.saveData();
        this.closeModal('brew-detail-modal');
        this.renderAll();
        this.toast('Brygg slettet', 'info');
    },

    // -- Brew Detail --
    openBrewDetail(brewId) {
        const brew = this.data.brews.find(b => b.id === brewId);
        if (!brew) return;

        const recipe = this.data.recipes.find(r => r.id === brew.recipeId);
        const modal = document.getElementById('brew-detail-modal');
        const title = document.getElementById('brew-detail-title');
        const body = document.getElementById('brew-detail-body');

        title.textContent = brew.name;

        // Calculate ABV if OG and FG are available
        let calculatedABV = null;
        if (brew.og && brew.fg) {
            const og = parseFloat(brew.og);
            const fg = parseFloat(brew.fg);
            if (!isNaN(og) && !isNaN(fg)) {
                calculatedABV = ((og - fg) * 131.25).toFixed(1);
            }
        }

        body.innerHTML = `
            <div class="brew-detail-header">
                <span class="status-badge status-${brew.status}">${this.statusLabels[brew.status]}</span>
                ${recipe ? `<div style="margin-top:0.5rem;font-size:0.9rem;color:var(--text-muted)">Oppskrift: <span style="color:var(--cream-200)">${this.esc(recipe.name)}</span></div>` : ''}
            </div>

            <div class="brew-detail-stats">
                <div class="brew-detail-stat">
                    <div class="val">${this.formatDate(brew.date)}</div>
                    <div class="lbl">Bryggedato</div>
                </div>
                ${brew.og ? `<div class="brew-detail-stat"><div class="val">${this.esc(brew.og)}</div><div class="lbl">OG</div></div>` : ''}
                ${brew.fg ? `<div class="brew-detail-stat"><div class="val">${this.esc(brew.fg)}</div><div class="lbl">FG</div></div>` : ''}
                ${calculatedABV ? `<div class="brew-detail-stat"><div class="val">${calculatedABV}%</div><div class="lbl">ABV</div></div>` : ''}
                ${brew.volume ? `<div class="brew-detail-stat"><div class="val">${brew.volume}L</div><div class="lbl">Volum</div></div>` : ''}
                ${brew.efficiency ? `<div class="brew-detail-stat"><div class="val">${brew.efficiency}%</div><div class="lbl">Effektivitet</div></div>` : ''}
            </div>

            ${brew.notes ? `<div style="margin:1rem 0;padding:1rem;background:var(--bg-input);border-radius:var(--radius-md);border:1px solid var(--border-primary);color:var(--text-secondary);font-size:0.88rem"><strong style="color:var(--cream-400)">Notater:</strong><br>${this.esc(brew.notes)}</div>` : ''}

            <div style="margin:1rem 0;display:flex;gap:0.5rem;flex-wrap:wrap">
                <button class="btn btn-sm btn-primary" onclick="app.openLogModal('${brew.id}')">+ Legg til loggpost</button>
                <button class="btn btn-sm btn-ghost" onclick="app.openBrewModal('${brew.id}'); app.closeModal('brew-detail-modal')">Rediger brygg</button>
                <button class="btn btn-sm btn-danger" onclick="app.deleteBrew('${brew.id}')">Slett brygg</button>
            </div>

            <div class="brew-progress" style="margin: 0.5rem 0 1.5rem">
                ${this.statusOrder.map((s, i) => {
                    const idx = this.statusOrder.indexOf(brew.status);
                    return `<div class="brew-progress-step ${i < idx ? 'completed' : ''} ${i === idx ? 'current' : ''}"></div>`;
                }).join('')}
            </div>

            <div class="brew-log-section">
                <h4>
                    Bryggelogg
                    <span style="font-weight:400;font-size:0.8rem;color:var(--text-muted)">(${(brew.log || []).length} poster)</span>
                </h4>
                ${this.renderBrewLog(brew)}
            </div>
        `;

        modal.classList.add('active');
    },

    renderBrewLog(brew) {
        const log = brew.log || [];
        if (log.length === 0) {
            return `<div style="color:var(--text-muted);font-size:0.88rem;padding:1rem 0">Ingen loggposter ennå. Legg til den første!</div>`;
        }

        const sorted = [...log].sort((a, b) => new Date(b.date) - new Date(a.date));

        return `
            <div class="log-entries">
                ${sorted.map(entry => `
                    <div class="log-entry">
                        <div class="log-date">${this.formatDateTime(entry.date)}</div>
                        <div><span class="log-type-badge">${this.logTypeLabels[entry.type] || entry.type}</span></div>
                        <div>
                            <div class="log-text">${this.esc(entry.text)}</div>
                            <div class="log-extra">
                                ${entry.gravity ? `<span>OG/FG: ${this.esc(entry.gravity)}</span>` : ''}
                                ${entry.temp ? `<span>🌡 ${entry.temp}°C</span>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    },

    // -- Log Entry --
    openLogModal(brewId) {
        document.getElementById('log-brew-id').value = brewId;
        document.getElementById('log-form').reset();
        document.getElementById('log-date').value = new Date().toISOString().slice(0, 16);
        document.getElementById('log-modal').classList.add('active');
    },

    saveLogEntry(e) {
        e.preventDefault();
        const brewId = document.getElementById('log-brew-id').value;
        const brew = this.data.brews.find(b => b.id === brewId);
        if (!brew) return;

        if (!brew.log) brew.log = [];

        brew.log.push({
            id: this.generateId(),
            type: document.getElementById('log-type').value,
            date: document.getElementById('log-date').value,
            gravity: document.getElementById('log-gravity').value.trim(),
            temp: document.getElementById('log-temp').value || null,
            text: document.getElementById('log-text').value.trim(),
        });

        brew.updatedAt = new Date().toISOString();
        this.saveData();
        this.closeModal('log-modal');
        this.openBrewDetail(brewId);
        this.toast('Loggpost lagt til!', 'success');
    },

    // ============================================
    // INGREDIENT CRUD
    // ============================================
    openIngredientModal(ingredientId = null) {
        const modal = document.getElementById('ingredient-modal');
        const form = document.getElementById('ingredient-form');
        const title = document.getElementById('ingredient-modal-title');

        form.reset();
        document.getElementById('ingredient-id').value = '';

        // Set current tab as default type
        document.getElementById('ingredient-type').value = this.currentIngredientTab;

        if (ingredientId) {
            const ingredient = this.data.ingredients.find(i => i.id === ingredientId);
            if (ingredient) {
                title.textContent = 'Rediger ingrediens';
                document.getElementById('ingredient-id').value = ingredient.id;
                document.getElementById('ingredient-name').value = ingredient.name;
                document.getElementById('ingredient-type').value = ingredient.type;
                document.getElementById('ingredient-amount').value = ingredient.amount || '';
                document.getElementById('ingredient-supplier').value = ingredient.supplier || '';
                document.getElementById('ingredient-alpha').value = ingredient.alpha || '';
                document.getElementById('ingredient-color').value = ingredient.color || '';
                document.getElementById('ingredient-notes').value = ingredient.notes || '';
            }
        } else {
            title.textContent = 'Ny ingrediens';
        }

        modal.classList.add('active');
    },

    saveIngredient(e) {
        e.preventDefault();
        const id = document.getElementById('ingredient-id').value || this.generateId();
        const isEdit = !!document.getElementById('ingredient-id').value;

        const ingredient = {
            id,
            name: document.getElementById('ingredient-name').value.trim(),
            type: document.getElementById('ingredient-type').value,
            amount: document.getElementById('ingredient-amount').value.trim(),
            supplier: document.getElementById('ingredient-supplier').value.trim(),
            alpha: parseFloat(document.getElementById('ingredient-alpha').value) || null,
            color: parseFloat(document.getElementById('ingredient-color').value) || null,
            notes: document.getElementById('ingredient-notes').value.trim(),
        };

        if (isEdit) {
            const idx = this.data.ingredients.findIndex(i => i.id === id);
            if (idx !== -1) this.data.ingredients[idx] = ingredient;
        } else {
            this.data.ingredients.push(ingredient);
        }

        this.saveData();
        this.closeModal('ingredient-modal');
        this.renderAll();
        this.toast(isEdit ? 'Ingrediens oppdatert!' : 'Ingrediens lagret!', 'success');
    },

    editIngredient(id) {
        this.openIngredientModal(id);
    },

    deleteIngredient(id) {
        if (!confirm('Vil du slette denne ingrediensen?')) return;
        this.data.ingredients = this.data.ingredients.filter(i => i.id !== id);
        this.saveData();
        this.renderAll();
        this.toast('Ingrediens slettet', 'info');
    },

    // ============================================
    // MODALS
    // ============================================
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },

    // Close modal on overlay click
    handleModalOverlayClick(e, modalId) {
        if (e.target.id === modalId) {
            this.closeModal(modalId);
        }
    },

    // ============================================
    // UTILITIES
    // ============================================
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
    },

    esc(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
            return dateStr;
        }
    },

    formatDateTime(dateStr) {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' }) +
                ' ' + d.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return dateStr;
        }
    },

    toast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // ============================================
    // DEMO DATA
    // ============================================
    seedDemoDataIfEmpty() {
        if (this.data.recipes.length > 0 || this.data.brews.length > 0) return;

        // Add sample ingredients
        this.data.ingredients = [
            { id: 'ing1', name: 'Maris Otter', type: 'malts', amount: '25 kg', supplier: 'Bryggeland', alpha: null, color: 5.5, notes: 'Basismalt, britisk' },
            { id: 'ing2', name: 'Pilsnermalt', type: 'malts', amount: '20 kg', supplier: 'Bryggeland', alpha: null, color: 3.5, notes: 'Tysk basismalt' },
            { id: 'ing3', name: 'Karamellmalt (C60)', type: 'malts', amount: '2 kg', supplier: 'Bryggeland', alpha: null, color: 60, notes: 'For fyle og sødme' },
            { id: 'ing4', name: 'Chokeladmalt', type: 'malts', amount: '1 kg', supplier: 'Bryggeland', alpha: null, color: 400, notes: 'For mørke øl' },
            { id: 'ing5', name: 'Centennial', type: 'hops', amount: '100g', supplier: 'YCH Hops', alpha: 10.5, color: null, notes: 'Citrus, blomster' },
            { id: 'ing6', name: 'Cascade', type: 'hops', amount: '100g', supplier: 'YCH Hops', alpha: 7.0, color: null, notes: 'Klassisk amerikansk humle' },
            { id: 'ing7', name: 'Hallertau Mittelfrüh', type: 'hops', amount: '50g', supplier: 'Hopsteiner', alpha: 4.0, color: null, notes: 'Tysk edelhumle' },
            { id: 'ing8', name: 'US-05', type: 'yeast', amount: '2 poser', supplier: 'Fermentis', alpha: null, color: null, notes: 'Amerikansk alegjær, ren gjæring' },
            { id: 'ing9', name: 'WLP001 California Ale', type: 'yeast', amount: '1 pakke', supplier: 'White Labs', alpha: null, color: null, notes: 'Klassisk ale-gjær' },
        ];

        // Add sample recipes
        this.data.recipes = [
            {
                id: 'rec1',
                name: 'Fjordlys Pale Ale',
                style: 'Pale Ale',
                batchSize: 20,
                og: '1.050',
                fg: '1.012',
                ibu: 35,
                abv: 5.0,
                srm: 7,
                mashTemp: 65,
                mashTime: 60,
                boilTime: 60,
                malts: [
                    { name: 'Maris Otter', amount: '4 kg', color: '' },
                    { name: 'Pilsnermalt', amount: '1.5 kg', color: '' },
                    { name: 'Karamellmalt (C60)', amount: '0.3 kg', color: '' },
                ],
                hops: [
                    { name: 'Centennial', amount: '15g', time: '60' },
                    { name: 'Cascade', amount: '25g', time: '15' },
                    { name: 'Cascade', amount: '30g', time: '5' },
                ],
                yeast: [
                    { name: 'US-05', amount: '1 pose' },
                ],
                notes: 'En frisk og fruktig pale ale med hint av citrus. Perfekt til sommeren!',
                createdAt: '2025-12-01T10:00:00Z',
                updatedAt: '2025-12-01T10:00:00Z',
            },
            {
                id: 'rec2',
                name: 'Mørkevinter Stout',
                style: 'Stout',
                batchSize: 20,
                og: '1.065',
                fg: '1.018',
                ibu: 45,
                abv: 6.2,
                srm: 35,
                mashTemp: 67,
                mashTime: 60,
                boilTime: 60,
                malts: [
                    { name: 'Maris Otter', amount: '5 kg', color: '' },
                    { name: 'Karamellmalt (C60)', amount: '0.5 kg', color: '' },
                    { name: 'Chokeladmalt', amount: '0.4 kg', color: '' },
                ],
                hops: [
                    { name: 'Centennial', amount: '25g', time: '60' },
                    { name: 'Hallertau Mittelfrüh', amount: '15g', time: '15' },
                ],
                yeast: [
                    { name: 'US-05', amount: '1 pose' },
                ],
                notes: 'Rik og kompleks stout med toner av kaffe og sjokolade. God til vinteren!',
                createdAt: '2026-01-15T10:00:00Z',
                updatedAt: '2026-01-15T10:00:00Z',
            },
            {
                id: 'rec3',
                name: 'Hagehøst Saison',
                style: 'Saison',
                batchSize: 20,
                og: '1.055',
                fg: '1.008',
                ibu: 28,
                abv: 6.2,
                srm: 5,
                mashTemp: 63,
                mashTime: 45,
                boilTime: 60,
                malts: [
                    { name: 'Pilsnermalt', amount: '4 kg', color: '' },
                    { name: 'Hvetemalt', amount: '1 kg', color: '' },
                ],
                hops: [
                    { name: 'Hallertau Mittelfrüh', amount: '20g', time: '60' },
                    { name: 'Cascade', amount: '15g', time: '5' },
                ],
                yeast: [
                    { name: 'WLP001 California Ale', amount: '1 pakke' },
                ],
                notes: 'Tørr og krydret saison – prøv med appelsinskall og koriander i koken!',
                createdAt: '2026-03-01T10:00:00Z',
                updatedAt: '2026-03-01T10:00:00Z',
            },
        ];

        // Add sample brews
        this.data.brews = [
            {
                id: 'brew1',
                name: 'Brygg #1 — Fjordlys v1',
                recipeId: 'rec1',
                status: 'drinking',
                date: '2025-12-15',
                og: '1.051',
                fg: '1.013',
                volume: 19.5,
                efficiency: 72,
                notes: 'Litt lavere volum enn forventet, men god smak!',
                log: [
                    { id: 'l1', type: 'mesking', date: '2025-12-15T10:00:00', gravity: '', temp: 65, text: 'Mesket ved 65°C i 60 min. Alt gikk bra.' },
                    { id: 'l2', type: 'kok', date: '2025-12-15T11:15:00', gravity: '', temp: 100, text: 'Kok opp, startet kokeur.' },
                    { id: 'l3', type: 'humleting', date: '2025-12-15T11:15:00', gravity: '', temp: null, text: 'Centennial 15g ved kokstart.' },
                    { id: 'l4', type: 'kjøling', date: '2025-12-15T12:15:00', gravity: '', temp: 20, text: 'Kjølt ned til 20°C med motstrømskjøler.' },
                    { id: 'l5', type: 'gjæring', date: '2025-12-15T12:30:00', gravity: '1.051', temp: 20, text: 'Tappet over til gjæringstank. Målt OG: 1.051.' },
                    { id: 'l6', type: 'måling', date: '2025-12-28T10:00:00', gravity: '1.013', temp: 18, text: 'Slutt-tyngde: 1.013. Gjæring ferdig.' },
                    { id: 'l7', type: 'tapping', date: '2026-01-05T11:00:00', gravity: '', temp: null, text: 'Tappet på flasker med primingssukker.' },
                ],
                createdAt: '2025-12-15T09:00:00Z',
                updatedAt: '2026-01-05T11:00:00Z',
            },
            {
                id: 'brew2',
                name: 'Brygg #2 — Mørkevinter',
                recipeId: 'rec2',
                status: 'fermenting',
                date: '2026-04-10',
                og: '1.063',
                fg: '',
                volume: 20,
                efficiency: 68,
                notes: 'Litt lavere effektivitet. Økte mesketiden neste gang.',
                log: [
                    { id: 'l8', type: 'mesking', date: '2026-04-10T09:30:00', gravity: '', temp: 67, text: 'Mesket ved 67°C i 60 min.' },
                    { id: 'l9', type: 'kjøling', date: '2026-04-10T11:30:00', gravity: '', temp: 19, text: 'Kjølt til 19°C.' },
                    { id: 'l10', type: 'gjæring', date: '2026-04-10T11:45:00', gravity: '1.063', temp: 19, text: 'OG: 1.063. Gjær pitches ved 19°C.' },
                ],
                createdAt: '2026-04-10T09:00:00Z',
                updatedAt: '2026-04-10T11:45:00Z',
            },
        ];

        this.saveData();
        this.renderAll();
    },
};

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    app.init();

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });

    // Close modals on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
        }
    });
});