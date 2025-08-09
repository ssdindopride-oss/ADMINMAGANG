import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, collection, onSnapshot, addDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';

// Global Constants for Firebase configuration
// These values are hardcoded for Netlify deployment, using your Firebase project details.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDZNczO4fuO3BVIQ1IZJnAAMu5zwWqOhpY",
  authDomain: "banjarejo-green-smart.firebaseapp.com",
  projectId: "banjarejo-green-smart",
  storageBucket: "banjarejo-green-smart.firebasestorage.app",
  messagingSenderId: "699423432436",
  appId: "1:699423432436:web:ba2d9332380d1bb56b48a1",
};

const APP_ID = FIREBASE_CONFIG.projectId;
const AUTH_TOKEN = null; // We explicitly set this to null for Netlify

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);
const auth = getAuth(app);

// Main application component
const App = () => {
    // State to manage UI and data
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState('login'); // Start with login page
    const [inventarisData, setInventarisData] = useState([]);
    const [mutasiData, setMutasiData] = useState([]);
    const [progresData, setProgresData] = useState([]);
    const [kegiatanData, setKegiatanData] = useState([]);
    const [kerjaSamaData, setKerjaSamaData] = useState([]);
    const [logData, setLogData] = useState([]);
    const [loginError, setLoginError] = useState('');
    const [userId, setUserId] = useState(null);

    // Effect for authentication and data synchronization
    useEffect(() => {
        const initFirebaseAndAuth = async () => {
            try {
                // We will always sign in anonymously on Netlify
                if (AUTH_TOKEN) {
                    // This block will never be executed on Netlify since AUTH_TOKEN is null
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Firebase auth error:", error);
            } finally {
                setLoading(false);
            }
        };

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setUserId(currentUser.uid);
                // When a user is authenticated, navigate to the dashboard
                setCurrentPage('dashboard');
            } else {
                setUser(null);
                setUserId(null);
            }
            setLoading(false);
        });

        initFirebaseAndAuth();

        // Cleanup listener
        return () => unsubscribeAuth();
    }, []);

    // New useEffect to sync data only when userId is available
    useEffect(() => {
        if (!userId) {
            setInventarisData([]);
            setMutasiData([]);
            setProgresData([]);
            setKegiatanData([]);
            setKerjaSamaData([]);
            setLogData([]);
            return;
        }

        const inventarisCollection = collection(db, 'artifacts', APP_ID, 'users', userId, 'inventaris');
        const mutasiCollection = collection(db, 'artifacts', APP_ID, 'users', userId, 'mutasi');
        const progresCollection = collection(db, 'artifacts', APP_ID, 'users', userId, 'progres');
        const kegiatanCollection = collection(db, 'artifacts', APP_ID, 'users', userId, 'kegiatan');
        const kerjaSamaCollection = collection(db, 'artifacts', APP_ID, 'users', userId, 'kerjaSama');
        const logCollection = collection(db, 'artifacts', APP_ID, 'users', userId, 'log');

        const unsubscribeInventaris = onSnapshot(inventarisCollection, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInventarisData(data);
        }, (error) => {
            console.error("Error fetching inventaris data:", error);
        });

        const unsubscribeMutasi = onSnapshot(mutasiCollection, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMutasiData(data);
        }, (error) => {
            console.error("Error fetching mutasi data:", error);
        });

        const unsubscribeProgres = onSnapshot(progresCollection, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProgresData(data);
        }, (error) => {
            console.error("Error fetching progres data:", error);
        });

        const unsubscribeKegiatan = onSnapshot(kegiatanCollection, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setKegiatanData(data);
        }, (error) => {
            console.error("Error fetching kegiatan data:", error);
        });

        const unsubscribeKerjaSama = onSnapshot(kerjaSamaCollection, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setKerjaSamaData(data);
        }, (error) => {
            console.error("Error fetching kerja sama data:", error);
        });

        const unsubscribeLog = onSnapshot(logCollection, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLogData(data);
        }, (error) => {
            console.error("Error fetching log data:", error);
        });

        // Cleanup listeners
        return () => {
            unsubscribeInventaris();
            unsubscribeMutasi();
            unsubscribeProgres();
            unsubscribeKegiatan();
            unsubscribeKerjaSama();
            unsubscribeLog();
        };

    }, [userId]);


    // Formatter for currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    // Formatter for date
    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' };
        return date.toLocaleDateString('id-ID', options);
    };

    // Function for navigation
    const navigate = (page) => {
        setCurrentPage(page);
    };

    // UI Components
    const LoadingScreen = () => (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
            <p className="ml-4 text-green-700 font-semibold">Memuat...</p>
        </div>
    );

    const LoginPage = () => {
        const [username, setUsername] = useState('');
        const [password, setPassword] = useState('');

        const handleLogin = (e) => {
            e.preventDefault();
            setLoginError('');
            if (username === 'admin' && password === 'admin123') {
                // Simulasikan login berhasil
                // Setel user secara manual untuk menghindari error autentikasi di lingkungan lokal
                setLoading(true);
                // Menunda sedikit agar terlihat seperti sedang loading
                setTimeout(() => {
                    setLoading(false);
                    setUser({ uid: 'simulated_user_id', displayName: 'Admin Banjarejo' });
                    setUserId('simulated_user_id');
                    setCurrentPage('dashboard');
                }, 1000);

            } else {
                setLoginError('Username atau password salah.');
            }
        };

        return (
            <div className="flex items-center justify-center min-h-screen bg-green-50">
                <div className="w-full max-w-md p-8 space-y-8 bg-white shadow-lg rounded-xl">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-green-700">BANJAREJO GREENSMART</h1>
                        <p className="mt-2 text-gray-500">Aplikasi Pencatatan Non-Profit</p>
                    </div>
                    <form onSubmit={handleLogin} className="mt-8 space-y-6">
                        <div>
                            <label className="text-gray-700">Username</label>
                            <input
                                type="text"
                                className="w-full p-3 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-gray-700">Password</label>
                            <input
                                type="password"
                                className="w-full p-3 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
                        <div>
                            <button
                                type="submit"
                                className="w-full py-3 text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            >
                                Login
                            </button>
                        </div>
                    </form>
                    <p className="text-center text-sm text-gray-500">
                        Untuk demo, gunakan username: <span className="font-bold">admin</span> dan password: <span className="font-bold">admin123</span>
                    </p>
                </div>
            </div>
        );
    };

    const MainAppLayout = () => (
        <div className="flex h-screen bg-green-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-xl flex-shrink-0 p-4 border-r border-gray-200">
                <div className="flex items-center justify-center p-4 mb-4 border-b border-gray-200">
                    <span className="text-2xl font-bold text-green-700">BANJAREJO</span>
                </div>
                <nav className="space-y-2">
                    <SideMenuItem icon="M3 12h18M3 6h18M3 18h18" label="Dashboard" onClick={() => navigate('dashboard')} />
                    <SideMenuItem icon="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" label="Inventaris Barang" onClick={() => navigate('inventaris')} />
                    <SideMenuItem icon="M5 13l4 4L19 7" label="Progres" onClick={() => navigate('progres')} />
                    <SideMenuItem icon="M13 10V3L4 14h7v7l9-11h-7z" label="Mutasi Barang" onClick={() => navigate('mutasi')} />
                    <SideMenuItem icon="M19 14l-7 7-7-7" label="Laporan Kegiatan" onClick={() => navigate('laporanKegiatan')} />
                    <SideMenuItem icon="M13 10V3L4 14h7v7l9-11h-7z" label="Kerja Sama Pihak Ke-3" onClick={() => navigate('kerjaSama')} />
                    <SideMenuItem icon="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-4.586-4.586a2 2 0 00-2.828 0L6 10m4 0l-1-1m4-4l-1-1m2-2l-1-1" label="Galeri" onClick={() => navigate('galeri')} />
                    <SideMenuItem icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" label="Log/Riwayat" onClick={() => navigate('log')} />
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto p-8">
                {renderPage()}
            </main>
        </div>
    );

    const SideMenuItem = ({ icon, label, onClick }) => (
        <a
            href="#"
            onClick={onClick}
            className="flex items-center p-3 text-sm font-medium text-gray-600 rounded-md hover:bg-green-100 hover:text-green-800 transition-colors"
        >
            <svg className="w-5 h-5 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}></path>
            </svg>
            {label}
        </a>
    );

    // Rendered page based on currentPage state
    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                const totalAnggaran = inventarisData.reduce((sum, item) => sum + (item.totalAnggaran || 0), 0);
                return (
                    <div className="space-y-8">
                        <h1 className="text-3xl font-bold text-green-800">Dashboard</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card title="Total Anggaran" value={formatCurrency(totalAnggaran)} />
                        </div>
                        <h2 className="text-2xl font-semibold text-green-700">Informasi Singkat</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card title="Jumlah Barang Inventaris" value={inventarisData.length} />
                            <Card title="Jumlah Mutasi" value={mutasiData.length} />
                            <Card title="Jumlah Kegiatan" value={kegiatanData.length} />
                            <Card title="Jumlah Kerja Sama" value={kerjaSamaData.length} />
                        </div>
                    </div>
                );
            case 'inventaris':
                return <InventarisPage />;
            case 'progres':
                return <ProgresPage />;
            case 'mutasi':
                return <MutasiBarangPage />;
            case 'laporanKegiatan':
                return <LaporanKegiatanPage />;
            case 'kerjaSama':
                return <KerjaSamaPage />;
            case 'galeri':
                return <GaleriPage />;
            case 'log':
                return <LogPage />;
            default:
                return null;
        }
    };

    const Card = ({ title, value }) => (
        <div className="p-6 bg-white rounded-xl shadow-md border border-green-200">
            <h3 className="text-lg font-medium text-gray-500">{title}</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">{value}</p>
        </div>
    );

    // Component for each page
    const InventarisPage = () => {
        const [searchQuery, setSearchQuery] = useState('');
        const [formData, setFormData] = useState({
            namaBarang: '', jumlah: '', sumberBarang: '', hargaSatuan: '', jenisBarang: '', buktiTransaksi: ''
        });
        const [editingId, setEditingId] = useState(null);

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        const handleAddOrUpdate = async (e) => {
            e.preventDefault();
            const harga = parseFloat(formData.hargaSatuan) || 0;
            const jumlah = parseInt(formData.jumlah, 10) || 0;
            const totalAnggaran = harga * jumlah;

            const newItem = {
                ...formData,
                hargaSatuan: harga,
                jumlah,
                totalAnggaran,
                createdAt: Timestamp.now(),
                kodeBarang: `INV-${Date.now()}`
            };

            try {
                if (editingId) {
                    await setDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'inventaris', editingId), newItem);
                    addLog('edit', `Mengedit barang inventaris: ${newItem.namaBarang}`);
                } else {
                    await addDoc(collection(db, 'artifacts', APP_ID, 'users', userId, 'inventaris'), newItem);
                    addLog('add', `Menambahkan barang inventaris: ${newItem.namaBarang}`);
                }
                resetForm();
            } catch (error) {
                console.error("Error adding/updating inventory:", error);
            }
        };

        const handleEdit = (item) => {
            setFormData(item);
            setEditingId(item.id);
        };

        const handleDelete = async (id, namaBarang) => {
            if (window.confirm(`Apakah Anda yakin ingin menghapus barang "${namaBarang}"?`)) {
                try {
                    await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'inventaris', id));
                    addLog('delete', `Menghapus barang inventaris: ${namaBarang}`);
                } catch (error) {
                    console.error("Error deleting inventory:", error);
                }
            }
        };
        
        const resetForm = () => {
            setFormData({
                namaBarang: '', jumlah: '', sumberBarang: '', hargaSatuan: '', jenisBarang: '', buktiTransaksi: ''
            });
            setEditingId(null);
        };

        const filteredData = inventarisData.filter(item =>
            item.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.kodeBarang.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-green-800">Inventaris Barang</h1>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-semibold text-green-700 mb-4">{editingId ? 'Edit Barang' : 'Tambah Barang'}</h2>
                    <form onSubmit={handleAddOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Nama Barang</label>
                            <input type="text" name="namaBarang" value={formData.namaBarang} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Jumlah</label>
                            <input type="number" name="jumlah" value={formData.jumlah} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Sumber Barang</label>
                            <input type="text" name="sumberBarang" value={formData.sumberBarang} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Harga Satuan</label>
                            <input type="number" name="hargaSatuan" value={formData.hargaSatuan} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Jenis Barang</label>
                            <select name="jenisBarang" value={formData.jenisBarang} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" required>
                                <option value="">Pilih Jenis</option>
                                <option value="Peternakan">Peternakan</option>
                                <option value="Perikanan">Perikanan</option>
                                <option value="Sayuran/Holtikultura">Sayuran/Holtikultura</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Bukti Transaksi (URL)</label>
                            <input type="text" name="buktiTransaksi" value={formData.buktiTransaksi} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div className="md:col-span-2 flex justify-end space-x-2 mt-4">
                            <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">{editingId ? 'Simpan Perubahan' : 'Tambah Barang'}</button>
                            {editingId && <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Batal</button>}
                        </div>
                    </form>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-green-700">Rekap Inventaris</h2>
                        <input
                            type="text"
                            placeholder="Cari..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-green-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Barang</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Barang</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sumber</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anggaran</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link Bukti</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredData.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.kodeBarang}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.namaBarang}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jumlah}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sumberBarang}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.totalAnggaran)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.buktiTransaksi && <a href={item.buktiTransaksi} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">Lihat</a>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                                            <button onClick={() => handleDelete(item.id, item.namaBarang)} className="text-red-600 hover:text-red-900">Hapus</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const ProgresPage = () => {
        const [searchQuery, setSearchQuery] = useState('');
        const [formData, setFormData] = useState({
            namaBarangId: '', proses: '', perkiraanPanen: ''
        });
        const [editingId, setEditingId] = useState(null);

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };
        
        const handleAddOrUpdate = async (e) => {
            e.preventDefault();
            const inventarisItem = inventarisData.find(item => item.id === formData.namaBarangId);
            const newItem = {
                ...formData,
                namaBarang: inventarisItem.namaBarang,
                createdAt: Timestamp.now()
            };
            try {
                if (editingId) {
                    await setDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'progres', editingId), newItem);
                    addLog('edit', `Mengedit progres untuk: ${newItem.namaBarang}`);
                } else {
                    await addDoc(collection(db, 'artifacts', APP_ID, 'users', userId, 'progres'), newItem);
                    addLog('add', `Menambahkan progres untuk: ${newItem.namaBarang}`);
                }
                resetForm();
            } catch (error) {
                console.error("Error adding/updating progress:", error);
            }
        };

        const handleEdit = (item) => {
            setFormData({ namaBarangId: item.namaBarangId, proses: item.proses, perkiraanPanen: item.perkiraanPanen });
            setEditingId(item.id);
        };
    
        const handleDelete = async (id, namaBarang) => {
            if (window.confirm(`Apakah Anda yakin ingin menghapus progres untuk "${namaBarang}"?`)) {
                try {
                    await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'progres', id));
                    addLog('delete', `Menghapus progres untuk: ${namaBarang}`);
                } catch (error) {
                    console.error("Error deleting progress:", error);
                }
            }
        };
        
        const resetForm = () => {
            setFormData({
                namaBarangId: '', proses: '', perkiraanPanen: ''
            });
            setEditingId(null);
        };

        const filteredData = progresData.filter(item =>
            item.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.proses.toLowerCase().includes(searchQuery.toLowerCase())
        );
    
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-green-800">Progres</h1>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-semibold text-green-700 mb-4">{editingId ? 'Edit Progres' : 'Tambah Progres'}</h2>
                    <form onSubmit={handleAddOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Nama Barang</label>
                            <select name="namaBarangId" value={formData.namaBarangId} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" required>
                                <option value="">Pilih Barang</option>
                                {inventarisData.map(item => (
                                    <option key={item.id} value={item.id}>{item.namaBarang}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Proses</label>
                            <input type="text" name="proses" value={formData.proses} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Perkiraan Panen</label>
                            <input type="date" name="perkiraanPanen" value={formData.perkiraanPanen} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div className="md:col-span-2 flex justify-end space-x-2 mt-4">
                            <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">{editingId ? 'Simpan Perubahan' : 'Tambah Progres'}</button>
                            {editingId && <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Batal</button>}
                        </div>
                    </form>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-green-700">Rekap Progres</h2>
                        <input
                            type="text"
                            placeholder="Cari..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-green-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Barang</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proses</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perkiraan Panen</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredData.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.namaBarang}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.proses}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.perkiraanPanen}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                                            <button onClick={() => handleDelete(item.id, item.namaBarang)} className="text-red-600 hover:text-red-900">Hapus</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const MutasiBarangPage = () => {
        const [searchQuery, setSearchQuery] = useState('');
        const [formData, setFormData] = useState({
            namaBarangId: '', jenisMutasi: '', jumlah: '', buktiFoto: ''
        });
        const [editingId, setEditingId] = useState(null);
        const [selectedItem, setSelectedItem] = useState(null);

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
            if (name === 'namaBarangId') {
                setSelectedItem(inventarisData.find(item => item.id === value));
            }
        };
        
        const handleAddOrUpdate = async (e) => {
            e.preventDefault();
            if (!selectedItem) return;
            const jumlahMutasi = parseInt(formData.jumlah, 10) || 0;
            const hargaSatuan = selectedItem.hargaSatuan;
            const totalAnggaran = jumlahMutasi * hargaSatuan;
    
            const newMutation = {
                ...formData,
                namaBarang: selectedItem.namaBarang,
                hargaSatuan,
                totalAnggaran,
                createdAt: Timestamp.now(),
            };

            // Update inventaris
            const updatedInventarisItem = { ...selectedItem };
            if (formData.jenisMutasi === 'Pemasukan') {
                updatedInventarisItem.jumlah += jumlahMutasi;
                updatedInventarisItem.totalAnggaran += totalAnggaran;
            } else if (formData.jenisMutasi === 'Pengeluaran') {
                updatedInventarisItem.jumlah -= jumlahMutasi;
                updatedInventarisItem.totalAnggaran -= totalAnggaran;
            }

            try {
                // Update inventaris
                await setDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'inventaris', selectedItem.id), updatedInventarisItem);

                // Tambah atau edit mutasi
                if (editingId) {
                    await setDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'mutasi', editingId), newMutation);
                    addLog('edit', `Mengedit mutasi untuk: ${newMutation.namaBarang}`);
                } else {
                    await addDoc(collection(db, 'artifacts', APP_ID, 'users', userId, 'mutasi'), newMutation);
                    addLog('add', `Menambahkan mutasi ${newMutation.jenisMutasi}: ${newMutation.namaBarang}`);
                }
                resetForm();
            } catch (error) {
                console.error("Error adding/updating mutation:", error);
            }
        };

        const handleEdit = (item) => {
            setFormData({ namaBarangId: item.namaBarangId, jenisMutasi: item.jenisMutasi, jumlah: item.jumlah, buktiFoto: item.buktiFoto });
            setSelectedItem(inventarisData.find(inv => inv.id === item.namaBarangId));
            setEditingId(item.id);
        };
    
        const handleDelete = async (id, namaBarang) => {
            if (window.confirm(`Apakah Anda yakin ingin menghapus mutasi untuk "${namaBarang}"?`)) {
                try {
                    await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'mutasi', id));
                    addLog('delete', `Menghapus mutasi untuk: ${namaBarang}`);
                } catch (error) {
                    console.error("Error deleting mutation:", error);
                }
            }
        };

        const resetForm = () => {
            setFormData({
                namaPihak3: '', jenisKerjaSama: '', tanggalMulai: '', lamaKontrak: '', buktiKerjaSama: ''
            });
            setEditingId(null);
        };

        const filteredData = mutasiData.filter(item =>
            item.namaPihak3.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.jenisMutasi.toLowerCase().includes(searchQuery.toLowerCase())
        );
    
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-green-800">Mutasi Barang</h1>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-semibold text-green-700 mb-4">{editingId ? 'Edit Mutasi' : 'Tambah Mutasi'}</h2>
                    <form onSubmit={handleAddOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Nama Barang</label>
                            <select name="namaBarangId" value={formData.namaBarangId} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" required>
                                <option value="">Pilih Barang</option>
                                {inventarisData.map(item => (
                                    <option key={item.id} value={item.id}>{item.namaBarang}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Jenis Mutasi</label>
                            <select name="jenisMutasi" value={formData.jenisMutasi} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" required>
                                <option value="">Pilih Jenis</option>
                                <option value="Pemasukan">Pemasukan</option>
                                <option value="Pengeluaran">Pengeluaran</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Harga Satuan</label>
                            <input type="text" value={selectedItem ? formatCurrency(selectedItem.hargaSatuan) : ''} readOnly className="mt-1 p-2 bg-gray-100 border border-gray-300 rounded-md" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Jumlah Barang</label>
                            <input type="number" name="jumlah" value={formData.jumlah} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Total Anggaran</label>
                            <input type="text" value={selectedItem ? formatCurrency(formData.jumlah * selectedItem.hargaSatuan) : 'Rp 0,00'} readOnly className="mt-1 p-2 bg-gray-100 border border-gray-300 rounded-md" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Bukti Foto (URL)</label>
                            <input type="text" name="buktiFoto" value={formData.buktiFoto} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div className="md:col-span-2 flex justify-end space-x-2 mt-4">
                            <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">{editingId ? 'Simpan Perubahan' : 'Tambah Mutasi'}</button>
                            {editingId && <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Batal</button>}
                        </div>
                    </form>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-green-700">Rekap Mutasi</h2>
                        <input
                            type="text"
                            placeholder="Cari..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-green-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Akun</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Mutasi</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Mutasi</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Anggaran</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link Bukti</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredData.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.namaAkun}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(item.createdAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jenisMutasi}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jumlah}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.totalAnggaran)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.buktiFoto && <a href={item.buktiFoto} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">Lihat</a>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                                            <button onClick={() => handleDelete(item.id, item.namaBarang)} className="text-red-600 hover:text-red-900">Hapus</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const LaporanKegiatanPage = () => {
        const [searchQuery, setSearchQuery] = useState('');
        const [formData, setFormData] = useState({
            namaKegiatan: '', tanggalKegiatan: '', jenisKegiatan: '', penerima: '', buktiKegiatan: ''
        });
        const [editingId, setEditingId] = useState(null);

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };
        
        const handleAddOrUpdate = async (e) => {
            e.preventDefault();
            const newItem = {
                ...formData,
                createdAt: Timestamp.now(),
            };
            try {
                if (editingId) {
                    await setDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'kegiatan', editingId), newItem);
                    addLog('edit', `Mengedit laporan kegiatan: ${newItem.namaKegiatan}`);
                } else {
                    await addDoc(collection(db, 'artifacts', APP_ID, 'users', userId, 'kegiatan'), newItem);
                    addLog('add', `Menambahkan laporan kegiatan: ${newItem.namaKegiatan}`);
                }
                resetForm();
            } catch (error) {
                console.error("Error adding/updating activity report:", error);
            }
        };

        const handleEdit = (item) => {
            setFormData({ namaKegiatan: item.namaKegiatan, tanggalKegiatan: item.tanggalKegiatan, jenisKegiatan: item.jenisKegiatan, penerima: item.penerima, buktiKegiatan: item.buktiKegiatan });
            setEditingId(item.id);
        };
    
        const handleDelete = async (id, namaKegiatan) => {
            if (window.confirm(`Apakah Anda yakin ingin menghapus laporan kegiatan "${namaKegiatan}"?`)) {
                try {
                    await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'kegiatan', id));
                    addLog('delete', `Menghapus laporan kegiatan: ${namaKegiatan}`);
                } catch (error) {
                    console.error("Error deleting activity report:", error);
                }
            }
        };
        
        const resetForm = () => {
            setFormData({
                namaKegiatan: '', tanggalKegiatan: '', jenisKegiatan: '', penerima: '', buktiKegiatan: ''
            });
            setEditingId(null);
        };

        const filteredData = kegiatanData.filter(item =>
            item.namaKegiatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.penerima.toLowerCase().includes(searchQuery.toLowerCase())
        );
    
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-green-800">Laporan Kegiatan</h1>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-semibold text-green-700 mb-4">{editingId ? 'Edit Laporan' : 'Tambah Laporan'}</h2>
                    <form onSubmit={handleAddOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Nama Kegiatan</label>
                            <input type="text" name="namaKegiatan" value={formData.namaKegiatan} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Tanggal Kegiatan</label>
                            <input type="date" name="tanggalKegiatan" value={formData.tanggalKegiatan} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Jenis Kegiatan</label>
                            <input type="text" name="jenisKegiatan" value={formData.jenisKegiatan} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Penerima</label>
                            <input type="text" name="penerima" value={formData.penerima} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div className="flex flex-col md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Bukti Kegiatan (URL Foto)</label>
                            <input type="text" name="buktiKegiatan" value={formData.buktiKegiatan} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div className="md:col-span-2 flex justify-end space-x-2 mt-4">
                            <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">{editingId ? 'Simpan Perubahan' : 'Tambah Laporan'}</button>
                            {editingId && <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Batal</button>}
                        </div>
                    </form>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-green-700">Rekap Laporan</h2>
                        <input
                            type="text"
                            placeholder="Cari..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-green-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Kegiatan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Kegiatan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link Bukti</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredData.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.tanggalKegiatan}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.namaKegiatan}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jenisKegiatan}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.buktiKegiatan && <a href={item.buktiKegiatan} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">Lihat</a>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                                            <button onClick={() => handleDelete(item.id, item.namaKegiatan)} className="text-red-600 hover:text-red-900">Hapus</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const KerjaSamaPage = () => {
        const [searchQuery, setSearchQuery] = useState('');
        const [formData, setFormData] = useState({
            namaPihak3: '', jenisKerjaSama: '', tanggalMulai: '', lamaKontrak: '', buktiKerjaSama: ''
        });
        const [editingId, setEditingId] = useState(null);

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };
        
        const handleAddOrUpdate = async (e) => {
            e.preventDefault();
            const tanggalBerakhir = new Date(formData.tanggalMulai);
            tanggalBerakhir.setMonth(tanggalBerakhir.getMonth() + parseInt(formData.lamaKontrak, 10));

            const newItem = {
                ...formData,
                tanggalBerakhir: tanggalBerakhir.toISOString().split('T')[0],
                createdAt: Timestamp.now(),
            };
            try {
                if (editingId) {
                    await setDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'kerjaSama', editingId), newItem);
                    addLog('edit', `Mengedit kerja sama: ${newItem.namaPihak3}`);
                } else {
                    await addDoc(collection(db, 'artifacts', APP_ID, 'users', userId, 'kerjaSama'), newItem);
                    addLog('add', `Menambahkan kerja sama: ${newItem.namaPihak3}`);
                }
                resetForm();
            } catch (error) {
                console.error("Error adding/updating collaboration:", error);
            }
        };

        const handleEdit = (item) => {
            setFormData({ namaPihak3: item.namaPihak3, jenisKerjaSama: item.jenisKerjaSama, tanggalMulai: item.tanggalMulai, lamaKontrak: item.lamaKontrak, buktiKerjaSama: item.buktiKerjaSama });
            setEditingId(item.id);
        };
    
        const handleDelete = async (id, namaPihak3) => {
            if (window.confirm(`Apakah Anda yakin ingin menghapus kerja sama dengan "${namaPihak3}"?`)) {
                try {
                    await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', userId, 'kerjaSama', id));
                    addLog('delete', `Menghapus kerja sama: ${namaPihak3}`);
                } catch (error) {
                    console.error("Error deleting collaboration:", error);
                }
            }
        };

        const resetForm = () => {
            setFormData({
                namaPihak3: '', jenisKerjaSama: '', tanggalMulai: '', lamaKontrak: '', buktiKerjaSama: ''
            });
            setEditingId(null);
        };

        const filteredData = kerjaSamaData.filter(item =>
            item.namaPihak3.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.jenisKerjaSama.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-green-800">Kerja Sama dengan Pihak ke-3</h1>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-semibold text-green-700 mb-4">{editingId ? 'Edit Kerja Sama' : 'Tambah Kerja Sama'}</h2>
                    <form onSubmit={handleAddOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Nama Pihak ke-3</label>
                            <input type="text" name="namaPihak3" value={formData.namaPihak3} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Jenis Kerja Sama</label>
                            <input type="text" name="jenisKerjaSama" value={formData.jenisKerjaSama} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Tanggal Mulai</label>
                            <input type="date" name="tanggalMulai" value={formData.tanggalMulai} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Lama Waktu Kontrak (Bulan)</label>
                            <input type="number" name="lamaKontrak" value={formData.lamaKontrak} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div className="flex flex-col md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Bukti Kerja Sama (URL PDF)</label>
                            <input type="text" name="buktiKerjaSama" value={formData.buktiKerjaSama} onChange={handleChange} className="mt-1 p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div className="md:col-span-2 flex justify-end space-x-2 mt-4">
                            <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">{editingId ? 'Simpan Perubahan' : 'Tambah Kerja Sama'}</button>
                            {editingId && <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Batal</button>}
                        </div>
                    </form>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-green-700">Rekap Kerja Sama</h2>
                        <input
                            type="text"
                            placeholder="Cari..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-green-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Pihak ke-3</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Kerja Sama</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Mulai</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Berakhir</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredData.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.namaPihak3}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.jenisKerjaSama}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.tanggalMulai}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.tanggalBerakhir}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                                            <button onClick={() => handleDelete(item.id, item.namaPihak3)} className="text-red-600 hover:text-red-900">Hapus</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const GaleriPage = () => {
        const allPhotos = [...mutasiData.filter(m => m.buktiFoto).map(m => ({ url: m.buktiFoto, description: `Mutasi: ${m.namaBarang}` })), ...kegiatanData.filter(k => k.buktiKegiatan).map(k => ({ url: k.buktiKegiatan, description: `Kegiatan: ${k.namaKegiatan}` }))];
        const [selectedPhoto, setSelectedPhoto] = useState(null);
        
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-green-800">Galeri</h1>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {allPhotos.map((photo, index) => (
                        <div key={index} className="relative group cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                            <img src={photo.url} alt={photo.description} className="w-full h-48 object-cover rounded-xl shadow-md transition-transform transform group-hover:scale-105" />
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                {photo.description}
                            </div>
                        </div>
                    ))}
                </div>
                {selectedPhoto && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPhoto(null)}>
                        <div className="relative max-w-3xl max-h-full">
                            <img src={selectedPhoto.url} alt={selectedPhoto.description} className="max-w-full max-h-full rounded-xl" />
                            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black bg-opacity-50 p-2 rounded-lg">{selectedPhoto.description}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const LogPage = () => {
        const [searchQuery, setSearchQuery] = useState('');

        const filteredData = logData.filter(item =>
            item.keterangan.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-green-800">Log/Riwayat</h1>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-green-700">Rekap Log</h2>
                        <input
                            type="text"
                            placeholder="Cari..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-green-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Akun</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredData.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.namaAkun}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(item.createdAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.keterangan}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const addLog = async (type, description) => {
        if (!userId) return;
        const logItem = {
            type,
            namaAkun: user?.displayName || 'Anonim',
            keterangan: description,
            createdAt: Timestamp.now(),
        };
        try {
            await addDoc(collection(db, 'artifacts', APP_ID, 'users', userId, 'log'), logItem);
        } catch (error) {
            console.error("Error adding log:", error);
        }
    };
    
    // Main display based on loading and user status
    if (loading) {
        return <LoadingScreen />;
    }

    if (!user) {
        return <LoginPage />;
    }

    return <MainAppLayout />;
};

export default App;
