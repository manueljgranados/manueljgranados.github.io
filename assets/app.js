// ====== CONFIGURACIÓN ======
const CONFIG = {
  githubUsername: "manueljgranados",
  // Repos destacados: use nombres EXACTOS de repositorio.
  featuredRepos: [
    "doc-rag-assistant",
    "otro-repo-destacado",
    "otro-repo-mas"
  ],
  // Si quiere ocultar repos (p. ej. forks o privados no salen, pero puede ocultar por nombre):
  hiddenRepos: ["manueljgranados.github.io"]
};

// ====== UTILIDADES ======
const $ = (id) => document.getElementById(id);

function fmtDate(iso){
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { year:"numeric", month:"short", day:"2-digit" });
}

function repoCard(repo){
  const desc = repo.description ? repo.description : "Sin descripción.";
  const lang = repo.language ? repo.language : "—";
  const stars = repo.stargazers_count ?? 0;

  const el = document.createElement("div");
  el.className = "item";
  el.innerHTML = `
    <h3><a href="${repo.html_url}" target="_blank" rel="noreferrer">${repo.name}</a></h3>
    <p>${escapeHtml(desc)}</p>
    <div class="meta">
    ${repo.fork ? `<span class="pill">Fork</span>` : ``}
    <span class="pill">Lenguaje: ${escapeHtml(lang)}</span>
    <span class="pill">★ ${stars}</span>
    <span class="pill">Actualizado: ${fmtDate(repo.updated_at)}</span>
    </div>

  `;
  return el;
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function sortRepos(repos, mode){
  const copy = [...repos];
  if (mode === "stars") copy.sort((a,b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0));
  else if (mode === "name") copy.sort((a,b) => a.name.localeCompare(b.name));
  else copy.sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));
  return copy;
}

function filterRepos(repos, q){
  const query = q.trim().toLowerCase();
  if (!query) return repos;
  return repos.filter(r =>
    (r.name || "").toLowerCase().includes(query) ||
    (r.description || "").toLowerCase().includes(query)
  );
}

// ====== CARGA DE REPOS ======
async function fetchAllRepos(username){
  // Nota: API pública sin token. Para cuentas con MUCHOS repos puede paginar.
  const url = `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
  return await res.json();
}

function renderList(containerId, repos){
  const container = $(containerId);
  container.innerHTML = "";
  repos.forEach(r => container.appendChild(repoCard(r)));
}

function renderFeatured(allRepos){
  const featured = CONFIG.featuredRepos
    .map(name => allRepos.find(r => r.name === name))
    .filter(Boolean);

  // Si no encuentra ninguno, muestra los 3 más recientes como fallback
  const fallback = sortRepos(allRepos, "updated").slice(0, 3);

  renderList("featured", featured.length ? featured : fallback);
}

function applyHidden(repos){
  return repos.filter(r => !CONFIG.hiddenRepos.includes(r.name));
}

async function main(){
  $("year").textContent = new Date().getFullYear();

  const status = $("status");
  status.textContent = "Cargando repositorios…";

  try{
    const raw = await fetchAllRepos(CONFIG.githubUsername);
    const repos = applyHidden(raw); // incluye forks

    renderFeatured(repos);

    // Estado UI
    const filterInput = $("filter");
    const sortSelect = $("sort");

    function rerender(){
      const filtered = filterRepos(repos, filterInput.value);
      const sorted = sortRepos(filtered, sortSelect.value);
      renderList("projects", sorted);
      status.textContent = `Mostrando ${sorted.length} repositorio(s).`;
    }

    filterInput.addEventListener("input", rerender);
    sortSelect.addEventListener("change", rerender);

    rerender();
  }catch(e){
    status.textContent = "No se han podido cargar los repositorios. Revise el nombre de usuario en assets/app.js.";
    console.error(e);
  }
}

main();
