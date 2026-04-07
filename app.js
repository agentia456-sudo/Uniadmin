import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// ───────── SUPABASE INIT ─────────
const supabase = createClient(
  "https://mxemardtyidrhfsnxvad.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZW1hcmR0eWlkcmhmc254dmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NzkwMzQsImV4cCI6MjA4ODQ1NTAzNH0.u1eFWdodluIqZQ-_Cr5IzSNMNUE1H4GQU-oDYT4Z1oo"
)

// ───────── LOGIN ─────────
document.getElementById('btn-login').addEventListener('click', login)

async function login() {
  const email = document.getElementById('email-input').value
  const password = document.getElementById('pw-input').value

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    document.getElementById('login-error').style.display = 'block'
    return
  }

  // Vérifier table admin
  const { data: admin } = await supabase
    .from('admin')
    .select('*')
    .eq('email', email)
    .single()

  if (!admin) {
    alert("Accès refusé")
    return
  }

  document.getElementById('login-screen').style.display = 'none'
  document.getElementById('app').style.display = 'block'

  loadCertificats()
}

// ───────── LOGOUT ─────────
window.doLogout = async () => {
  await supabase.auth.signOut()
  location.reload()
}

// ───────── NAVIGATION ─────────
window.showPage = (id) => {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
  document.getElementById('page-' + id).classList.add('active')
}

// ───────── CERTIFICATS ─────────
let certificats = []

async function loadCertificats() {
  const { data } = await supabase.from('certificats').select('*')
  certificats = data || []
  renderCertificats()
}

function renderCertificats() {
  const tbody = document.getElementById('cert-tbody')
  tbody.innerHTML = ''

  certificats.forEach(c => {
    const tr = document.createElement('tr')

    tr.innerHTML = `
      <td>${c.id}</td>
      <td>${c.student_id}</td>
      <td>${c.type}</td>
      <td>${c.status}</td>
      <td>
        <button onclick="openModal(${c.id})">Signer</button>
      </td>
    `

    tbody.appendChild(tr)
  })
}

// ───────── MODAL SIGNATURE ─────────
let currentId = null

window.openModal = (id) => {
  currentId = id
  document.getElementById('modal-overlay').classList.add('open')
}

window.closeModal = () => {
  document.getElementById('modal-overlay').classList.remove('open')
}

window.confirmSign = async () => {
  if (!currentId) return

  // 1️⃣ mettre signé
  await supabase
    .from('certificats')
    .update({ status: 'signed' })
    .eq('id', currentId)

  // 2️⃣ envoyer email via webhook n8n
  await fetch("https://n8n-mcda.onrender.com/webhook-test/certificat-signe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cert_id: currentId })
  })

  // 3️⃣ mettre envoyé
  await supabase
    .from('certificats')
    .update({ status: 'sent' })
    .eq('id', currentId)

  showToast("Certificat envoyé ✅")
  closeModal()
  loadCertificats()
}

// ───────── UPLOAD PLANNING ─────────
document.querySelectorAll('.btn-upload')[0].addEventListener('click', async () => {
  const file = document.querySelectorAll('input[type=file]')[0]?.files[0]
  if (!file) return alert("Choisir fichier")

  await supabase.storage
    .from('planning')
    .upload(`planning/${file.name}`, file)

  showToast("Planning uploadé ✅")
})

// ───────── UPLOAD NOTES ─────────
document.querySelectorAll('.btn-upload')[1].addEventListener('click', async () => {
  const file = document.querySelectorAll('input[type=file]')[1]?.files[0]
  if (!file) return alert("Choisir fichier")

  await supabase.storage
    .from('notes')
    .upload(`notes/${file.name}`, file)

  showToast("Notes uploadées ✅")
})

// ───────── TOAST ─────────
function showToast(msg) {
  const t = document.getElementById('toast')
  document.getElementById('toast-msg').textContent = msg
  t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 3000)
}