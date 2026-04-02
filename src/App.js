import React, { useState, useMemo, useEffect } from "react";
import {
  Book,
  Library,
  Tent,
  FileSpreadsheet,
  UploadCloud,
  Plus,
  Search,
  MapPin,
  Store,
  CheckCircle2,
  PackageOpen,
  FileText,
  ShoppingCart,
  CreditCard,
  Trash2,
  Cloud,
  LogOut,
  User,
  Lock,
  Mail,
  Pencil,
  MinusCircle,
  Settings,
  DownloadCloud,
  Coffee,
  AlertTriangle,
} from "lucide-react";

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

// --- Firebase Initialization ---
// ============================================================================
// 🔥 系統永久上線設定區 🔥
// 如果您希望資料永久保存（不受重新整理影響），請將您的 Firebase 設定貼在下方：
// ============================================================================
const MY_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCGVLnKj-F10zg6AgIwUjAVZ9SKKu5Zy4s",
  authDomain: "terepashimanga.firebaseapp.com",
  projectId: "terepashimanga",
  storageBucket: "terepashimanga.firebasestorage.app",
  messagingSenderId: "1077938311796",
  appId: "1:1077938311796:web:5ad2bfb3cdc8e67da0b721",
};
/* 範例：將 null 替換為以下格式
const MY_FIREBASE_CONFIG = {
  apiKey: "AIzaSyB...",
  authDomain: "your-bookstore.firebaseapp.com",
  projectId: "your-bookstore",
  storageBucket: "your-bookstore.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
*/

// 🌟 新增：安全的 Firebase 啟動檢查機制
const firebaseConfig =
  MY_FIREBASE_CONFIG ||
  (typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : null);
let app, auth, db;
let isFirebaseConfigured = false;

if (firebaseConfig && firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  isFirebaseConfigured = true;
}

const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

// --- Mock Initial Data ---
const initialBooks = [];
const initialMarkets = [];
const initialSales = [];

// --- Google Sheets Webhook Configuration ---
// 🔥 請將您部署好的 Apps Script URL 貼在下方引號中 🔥
const GOOGLE_SHEET_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbxkbu3SuXyH0foY3nGlecOryNKNK4682aRK9grak8R2r5y2TTc6SDys1CqPRmgJVQPvZA/exec";

export default function App() {
  const [activeTab, setActiveTab] = useState("inventory"); // inventory, market, reports, pos, settings
  const [posLocation, setPosLocation] = useState("Tainan"); // 🌟 POS 門市記憶拉到外層

  const [books, setBooks] = useState(initialBooks);
  const [markets, setMarkets] = useState(initialMarkets);
  const [sales, setSales] = useState(initialSales);

  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // 🌟 新增：未設定 Firebase 時的提示畫面
  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-2xl w-full border-t-8 border-indigo-500">
          <div className="flex items-center text-indigo-600 mb-6">
            <AlertTriangle size={36} className="mr-3" />
            <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
              系統設定提醒
            </h1>
          </div>
          <p className="text-gray-600 mb-6 text-lg leading-relaxed">
            系統偵測到您尚未填寫 Firebase
            的連線金鑰。為了保護您的資料安全與正常運作，請完成以下步驟：
          </p>
          <div className="bg-slate-800 text-slate-300 p-6 rounded-xl font-mono text-sm shadow-inner mb-6 overflow-x-auto">
            <p className="mb-2 text-slate-400">
              // 請在程式碼大約第 39 行的位置，找到以下變數：
            </p>
            <p className="text-red-400 mb-4 line-through">
              const MY_FIREBASE_CONFIG = null;
            </p>
            <p className="mb-2 text-slate-400">
              // 並將其替換為您從 Firebase 取得的設定檔：
            </p>
            <p className="text-green-400">const MY_FIREBASE_CONFIG = {"{"}</p>
            <p className="text-green-300 ml-4">apiKey: "AIzaSyB...",</p>
            <p className="text-green-300 ml-4">
              authDomain: "xin-chuan-books.firebaseapp.com",
            </p>
            <p className="text-green-300 ml-4">projectId: "xin-chuan-books",</p>
            <p className="text-green-300 ml-4">...</p>
            <p className="text-green-400">{"};"}</p>
          </div>
          <p className="text-gray-500 text-sm">
            💡
            貼上並存檔後，這個畫面就會自動消失，並啟動心傳租書社的專屬登入頁面囉！
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !user || !db) return;

    // Subscribe to store data changes
    const storeRef = doc(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "storeData",
      "main"
    );

    const unsubscribe = onSnapshot(
      storeRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.books) setBooks(data.books);
          if (data.markets) setMarkets(data.markets);
          if (data.sales) setSales(data.sales);
        } else {
          // Initialize with default data if document doesn't exist
          setDoc(
            storeRef,
            {
              books: initialBooks,
              markets: initialMarkets,
              sales: initialSales,
            },
            { merge: true }
          );
        }
      },
      (error) => {
        console.error("Firestore sync error:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const updateStore = async (updates) => {
    if (!isFirebaseConfigured || !user || !db) return;
    const storeRef = doc(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "storeData",
      "main"
    );
    await setDoc(storeRef, updates, { merge: true });
  };

  // --- Utility Functions ---
  const getBook = (id) =>
    books.find((b) => b.id === id) || {
      title: "自訂商品/已刪除書籍",
      type: "other",
    };

  const sendToGoogleSheets = async (newSalesData) => {
    if (!GOOGLE_SHEET_WEBHOOK_URL) return;

    // 將銷售數據轉換成 Google Sheets 預期的格式
    const payload = newSalesData.map((s) => {
      const book = getBook(s.bookId);
      // 處理自訂商品 (通常 ID 會以 'custom_' 開頭)
      const isCustom = s.bookId.startsWith("custom_");

      return {
        date: s.date,
        location: s.location,
        title: isCustom ? s.title : book?.title || "未知書籍",
        type: isCustom
          ? "其他(咖啡/雜貨)"
          : book?.type === "consignment"
          ? "寄售"
          : "經銷商",
        quantity: s.quantity,
        total: s.total,
      };
    });

    try {
      await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      console.log("成功同步至 Google Sheets!");
    } catch (error) {
      console.error("同步至 Google Sheets 失敗:", error);
    }
  };

  // --- View: Auth (Login / Register) ---
  const AuthView = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
      e.preventDefault();
      if (!isFirebaseConfigured || !auth) return;

      setLoading(true);
      setError("");
      try {
        if (isLogin) {
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          await createUserWithEmailAndPassword(auth, email, password);
        }
      } catch (err) {
        if (
          err.code === "auth/user-not-found" ||
          err.code === "auth/wrong-password"
        ) {
          setError("登入失敗：帳號或密碼錯誤。");
        } else if (err.code === "auth/email-already-in-use") {
          setError("註冊失敗：此信箱已被使用。");
        } else if (err.code === "auth/weak-password") {
          setError("註冊失敗：密碼太弱，請至少輸入 6 個字元。");
        } else {
          setError(`驗證錯誤：${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] max-w-md w-full p-10 border border-white/20 backdrop-blur-sm">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-600 p-4 rounded-2xl inline-block mb-4 shadow-sm">
              <Library size={36} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
              心傳租書社管理系統
            </h1>
            <p className="text-gray-500 mt-2 font-medium">
              請登入以存取您的雲端庫存與報表
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm text-center border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                電子郵件 Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-3 text-gray-400"
                  size={18}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="admin@bookstore.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                密碼 Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-3 text-gray-400"
                  size={18}
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-md mt-2 ${
                loading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 hover:shadow-lg active:scale-[0.98]"
              }`}
            >
              {loading ? "處理中..." : isLogin ? "登入系統" : "註冊新帳號"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500 font-medium">
            {isLogin ? "還沒有帳號嗎？" : "已經有帳號了？"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-indigo-600 font-bold ml-1 hover:text-indigo-800 transition-colors"
            >
              {isLogin ? "建立新帳號" : "切換至登入"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- View: Inventory ---
  const InventoryView = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showCloudImportModal, setShowCloudImportModal] = useState(false);
    const [cloudUrl, setCloudUrl] = useState("");
    const [isCloudLoading, setIsCloudLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [returningBook, setReturningBook] = useState(null);

    const filteredBooks = books.filter(
      (b) =>
        b.title.includes(searchTerm) ||
        b.author.includes(searchTerm) ||
        b.isbn.includes(searchTerm)
    );

    const handleAddBook = (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const newBook = {
        id: "b" + Date.now() + Math.random().toString(36).substr(2, 9),
        title: formData.get("title"),
        author: formData.get("author"),
        isbn: formData.get("isbn") || "N/A",
        type: formData.get("type"),
        cost: Number(formData.get("cost")),
        price: Number(formData.get("price")),
        stockTainan: Number(formData.get("stockTainan")),
        stockPingtung: Number(formData.get("stockPingtung")),
      };
      updateStore({ books: [...books, newBook] });
      setShowAddModal(false);
    };

    const downloadCSVTemplate = () => {
      const template =
        "書名,作者,ISBN,來源(經銷商/寄售),成本,售價,台南庫存,屏東庫存\n範例書名,王小明,9781234567890,經銷商,200,300,10,5\n獨立小誌,小陳,N/A,寄售,100,150,20,0";
      // 加入 BOM (\uFEFF) 讓 Excel 用 UTF-8 開啟時不會亂碼
      const blob = new Blob(["\uFEFF" + template], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "書籍批次建檔範本.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // --- 核心：解析陣列資料並執行「智慧合併」 ---
    const processBooksFromArray = (rows) => {
      let addedCount = 0;
      let updatedCount = 0;
      let updatedBooks = [...books];

      // 1. 動態尋找表頭 (Header)
      let headerRowIndex = -1;
      let colMap = {};
      for (let i = 0; i < rows.length; i++) {
        if (!rows[i] || rows[i].length === 0) continue;
        const rowStr = rows[i].join("").replace(/\s+/g, "");
        if (
          rowStr.includes("書名") &&
          (rowStr.includes("定價") ||
            rowStr.includes("售價") ||
            rowStr.includes("ISBN"))
        ) {
          headerRowIndex = i;
          rows[i].forEach((col, idx) => {
            if (col) colMap[String(col).trim()] = idx;
          });
          break;
        }
      }

      if (headerRowIndex === -1) {
        alert("找不到有效的表頭，請確認檔案內是否包含「書名」等必要欄位。");
        return false;
      }

      // 2. 開始解析資料列
      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const cols = rows[i];
        if (!cols || cols.length === 0) continue;

        const rowStr = cols.join("");
        if (rowStr.includes("缺書記錄") || rowStr.includes("缺書紀錄")) {
          break; // 跳過缺書紀錄
        }

        const title = String(cols[colMap["書名"]] || "").trim();
        if (!title) continue;

        const author = String(
          cols[colMap["出版社"]] || cols[colMap["作者"]] || ""
        ).trim();
        const isbn = String(cols[colMap["ISBN"]] || "N/A").trim();

        let cost = 0;
        let price = 0;
        if (colMap["定價"] !== undefined && colMap["銷貨折扣"] !== undefined) {
          price = Number(cols[colMap["定價"]]) || 0;
          cost = Number(cols[colMap["售價"]]) || 0;
        } else {
          cost = Number(cols[colMap["成本"]]) || 0;
          price = Number(cols[colMap["售價"]]) || 0;
        }

        const incomingTainan =
          Number(cols[colMap["數量"]] || cols[colMap["台南庫存"]]) || 0;
        const incomingPingtung = Number(cols[colMap["屏東庫存"]]) || 0;

        const typeRaw = String(cols[colMap["來源(經銷商/寄售)"]] || "");
        const type = typeRaw.includes("寄售") ? "consignment" : "distributor";

        const existingBookIndex = updatedBooks.findIndex(
          (b) => (isbn !== "N/A" && b.isbn === isbn) || b.title === title
        );

        if (existingBookIndex >= 0) {
          updatedBooks[existingBookIndex] = {
            ...updatedBooks[existingBookIndex],
            cost: cost,
            price: price,
            stockTainan:
              updatedBooks[existingBookIndex].stockTainan + incomingTainan,
            stockPingtung:
              updatedBooks[existingBookIndex].stockPingtung + incomingPingtung,
          };
          updatedCount++;
        } else {
          updatedBooks.push({
            id: "b" + Date.now() + Math.random().toString(36).substr(2, 9),
            title,
            author,
            isbn,
            type,
            cost,
            price,
            stockTainan: incomingTainan,
            stockPingtung: incomingPingtung,
          });
          addedCount++;
        }
      }

      if (addedCount > 0 || updatedCount > 0) {
        updateStore({ books: updatedBooks });
        alert(
          `匯入成功！\n- 新增了 ${addedCount} 種新書\n- 更新了 ${updatedCount} 種既有書籍的庫存與價格`
        );
        return true;
      } else {
        alert("找不到有效的書籍資料，請確認格式是否正確。");
        return false;
      }
    };

    const handleBatchUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop().toLowerCase();

      if (fileExt === "xls" || fileExt === "xlsx") {
        setIsUploading(true);
        if (!window.XLSX) {
          try {
            await new Promise((resolve, reject) => {
              const script = document.createElement("script");
              script.src =
                "https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js";
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
            });
          } catch (err) {
            alert("載入 Excel 解析套件失敗，請檢查網路連線。");
            setIsUploading(false);
            e.target.value = "";
            return;
          }
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target.result);
            const workbook = window.XLSX.read(data, { type: "array" });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rows = window.XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
            });

            const success = processBooksFromArray(rows);
            if (success) setShowUploadModal(false);
          } catch (err) {
            alert("Excel 檔案解析失敗，請確認檔案是否損壞或被加密。");
          } finally {
            setIsUploading(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (fileExt === "csv") {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target.result;
          const rows = text
            .split("\n")
            .filter((line) => line.trim() !== "")
            .map((line) => line.split(",").map((c) => c.trim()));
          const success = processBooksFromArray(rows);
          if (success) setShowUploadModal(false);
        };
        reader.readAsText(file);
      } else {
        alert("不支援的檔案格式，請上傳 CSV, XLS 或 XLSX 檔案。");
      }

      e.target.value = "";
    };

    const handleUpdateBook = (e) => {
      e.preventDefault();
      if (!editingBook) return;

      const formData = new FormData(e.target);
      const updatedBooks = books.map((b) => {
        if (b.id === editingBook.id) {
          return {
            ...b,
            title: formData.get("title"),
            author: formData.get("author"),
            isbn: formData.get("isbn") || "N/A",
            type: formData.get("type"),
            cost: Number(formData.get("cost")),
            price: Number(formData.get("price")),
            stockTainan: Number(formData.get("stockTainan")),
            stockPingtung: Number(formData.get("stockPingtung")),
          };
        }
        return b;
      });

      updateStore({ books: updatedBooks });
      setEditingBook(null);
    };

    const handleDeleteBook = (bookId, title) => {
      if (
        window.confirm(
          `⚠️ 警告：您確定要永久刪除《${title}》的庫存紀錄嗎？\n此動作通常用於建檔錯誤。若是退貨給經銷商，建議使用「退書/報廢」功能將庫存扣減即可。`
        )
      ) {
        const updatedBooks = books.filter((b) => b.id !== bookId);
        updateStore({ books: updatedBooks });
      }
    };

    const handleReturnBook = (e) => {
      e.preventDefault();
      if (!returningBook) return;

      const formData = new FormData(e.target);
      const returnTainan = Number(formData.get("returnTainan")) || 0;
      const returnPingtung = Number(formData.get("returnPingtung")) || 0;

      if (
        returnTainan > returningBook.stockTainan ||
        returnPingtung > returningBook.stockPingtung
      ) {
        alert("退回數量不能大於現有庫存！");
        return;
      }

      if (returnTainan === 0 && returnPingtung === 0) {
        alert("請輸入大於 0 的退書數量");
        return;
      }

      const updatedBooks = books.map((b) => {
        if (b.id === returningBook.id) {
          return {
            ...b,
            stockTainan: b.stockTainan - returnTainan,
            stockPingtung: b.stockPingtung - returnPingtung,
          };
        }
        return b;
      });

      updateStore({ books: updatedBooks });
      alert(`✅ 退書成功！已從系統扣除指定的庫存數量。`);
      setReturningBook(null);
    };

    const handleCloudImport = async () => {
      if (!cloudUrl.includes("pub?output=csv")) {
        alert("網址格式錯誤！請確保您貼上的是「發佈到網路」的 CSV 連結。");
        return;
      }

      setIsCloudLoading(true);
      try {
        const response = await fetch(cloudUrl);
        if (!response.ok) throw new Error("Network response was not ok");
        const csvText = await response.text();
        const rows = csvText
          .split("\n")
          .filter((line) => line.trim() !== "")
          .map((line) => line.split(",").map((c) => c.trim()));
        const success = processBooksFromArray(rows);
        if (success) {
          setShowCloudImportModal(false);
          setCloudUrl("");
        }
      } catch (error) {
        alert(
          "讀取雲端試算表失敗，請確認您的試算表是否已設為「公開發佈」。\n錯誤訊息: " +
            error.message
        );
      } finally {
        setIsCloudLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">總庫存管理</h2>
          <div className="space-x-3">
            <button
              onClick={() => setShowCloudImportModal(true)}
              className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 flex items-center transition"
            >
              <Cloud size={18} className="mr-2" />
              雲端試算表進貨
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 flex items-center transition"
            >
              <UploadCloud size={18} className="mr-2" />
              批次檔案建檔
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition shadow-sm"
            >
              <Plus size={18} className="mr-2" />
              手手動新增書籍
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜尋書名、作者或 ISBN..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b">
                  <th className="p-3 font-medium">書名 / 作者(出版社)</th>
                  <th className="p-3 font-medium">來源</th>
                  <th className="p-3 font-medium">售價</th>
                  <th className="p-3 font-medium text-center">台南庫存</th>
                  <th className="p-3 font-medium text-center">屏東庫存</th>
                  <th className="p-3 font-medium text-center">總庫存</th>
                  <th className="p-3 font-medium text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book) => (
                  <tr
                    key={book.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3">
                      <div className="font-medium text-gray-800">
                        {book.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {book.author} | ISBN: {book.isbn}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          book.type === "consignment"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {book.type === "consignment" ? "寄售" : "經銷商"}
                      </span>
                    </td>
                    <td className="p-3 font-medium">NT$ {book.price}</td>
                    <td className="p-3 text-center">
                      <span className="font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                        {book.stockTainan}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                        {book.stockPingtung}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-indigo-600">
                      {book.stockTainan + book.stockPingtung}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => setReturningBook(book)}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="退書與報廢 (扣除庫存)"
                        >
                          <MinusCircle size={18} />
                        </button>
                        <button
                          onClick={() => setEditingBook(book)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="編輯與調撥庫存"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book.id, book.title)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="永久刪除書籍"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBooks.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center p-8 text-gray-500">
                      目前庫存空空如也，點擊上方按鈕開始建檔吧！
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Book Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-xl">
              <h3 className="text-xl font-bold mb-4">手動新增書籍</h3>
              <form onSubmit={handleAddBook} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    書名 *
                  </label>
                  <input
                    name="title"
                    required
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      作者 / 出版社
                    </label>
                    <input
                      name="author"
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      ISBN
                    </label>
                    <input name="isbn" className="w-full border p-2 rounded" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    來源類型 *
                  </label>
                  <select name="type" className="w-full border p-2 rounded">
                    <option value="distributor">經銷商進貨</option>
                    <option value="consignment">創作者寄售</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      成本價
                    </label>
                    <input
                      name="cost"
                      type="number"
                      required
                      defaultValue={0}
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      終端售價 *
                    </label>
                    <input
                      name="price"
                      type="number"
                      required
                      defaultValue={0}
                      className="w-full border p-2 rounded"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      進貨至：台南庫存
                    </label>
                    <input
                      name="stockTainan"
                      type="number"
                      min="0"
                      required
                      defaultValue={0}
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      進貨至：屏東庫存
                    </label>
                    <input
                      name="stockPingtung"
                      type="number"
                      min="0"
                      required
                      defaultValue={0}
                      className="w-full border p-2 rounded"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    儲存入庫
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Book Modal */}
        {editingBook && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-xl">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Pencil className="mr-2 text-indigo-600" size={20} />
                編輯書籍與庫存調撥
              </h3>
              <form onSubmit={handleUpdateBook} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    書名 *
                  </label>
                  <input
                    name="title"
                    required
                    defaultValue={editingBook.title}
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      作者 / 出版社
                    </label>
                    <input
                      name="author"
                      defaultValue={editingBook.author}
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      ISBN
                    </label>
                    <input
                      name="isbn"
                      defaultValue={
                        editingBook.isbn === "N/A" ? "" : editingBook.isbn
                      }
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    來源類型 *
                  </label>
                  <select
                    name="type"
                    defaultValue={editingBook.type}
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="distributor">經銷商進貨</option>
                    <option value="consignment">創作者寄售</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      成本價
                    </label>
                    <input
                      name="cost"
                      type="number"
                      required
                      defaultValue={editingBook.cost}
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      終端售價 *
                    </label>
                    <input
                      name="price"
                      type="number"
                      required
                      defaultValue={editingBook.price}
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* 庫存調撥區塊 */}
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <h4 className="text-sm font-bold text-indigo-800 mb-3">
                    📍 庫存調撥與修改
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-indigo-700 mb-1 font-medium">
                        台南庫存
                      </label>
                      <input
                        name="stockTainan"
                        type="number"
                        min="0"
                        required
                        defaultValue={editingBook.stockTainan}
                        className="w-full border border-indigo-200 p-2 rounded bg-white focus:ring-2 focus:ring-indigo-500 text-center font-bold text-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-indigo-700 mb-1 font-medium">
                        屏東庫存
                      </label>
                      <input
                        name="stockPingtung"
                        type="number"
                        min="0"
                        required
                        defaultValue={editingBook.stockPingtung}
                        className="w-full border border-indigo-200 p-2 rounded bg-white focus:ring-2 focus:ring-indigo-500 text-center font-bold text-lg"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-indigo-500 mt-2">
                    提示：若需調撥，請直接手動加減雙邊的數量即可。例如台南-5，屏東+5。
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                  <button
                    type="button"
                    onClick={() => setEditingBook(null)}
                    className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-md font-bold"
                  >
                    儲存變更
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Return Book Modal */}
        {returningBook && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-xl">
              <h3 className="text-xl font-bold mb-2 flex items-center text-orange-600">
                <MinusCircle className="mr-2" size={20} />
                退書 / 報廢作業
              </h3>
              <p className="text-sm text-gray-600 mb-4 font-medium border-b pb-3">
                您正在辦理 《{returningBook.title}》
                的退書作業，請輸入要扣除的數量。
              </p>
              <form onSubmit={handleReturnBook} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                    <label className="block text-sm text-orange-800 mb-1 font-bold">
                      從台南退回
                    </label>
                    <div className="text-xs text-orange-600 mb-2">
                      現有: {returningBook.stockTainan} 本
                    </div>
                    <input
                      name="returnTainan"
                      type="number"
                      min="0"
                      max={returningBook.stockTainan}
                      defaultValue={0}
                      className="w-full border border-orange-200 p-2 rounded bg-white focus:ring-2 focus:ring-orange-500 text-center font-bold text-lg"
                    />
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                    <label className="block text-sm text-orange-800 mb-1 font-bold">
                      從屏東退回
                    </label>
                    <div className="text-xs text-orange-600 mb-2">
                      現有: {returningBook.stockPingtung} 本
                    </div>
                    <input
                      name="returnPingtung"
                      type="number"
                      min="0"
                      max={returningBook.stockPingtung}
                      defaultValue={0}
                      className="w-full border border-orange-200 p-2 rounded bg-white focus:ring-2 focus:ring-orange-500 text-center font-bold text-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                  <button
                    type="button"
                    onClick={() => setReturningBook(null)}
                    className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition shadow-md font-bold"
                  >
                    確認扣除
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Upload CSV/Excel Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl text-center">
              <FileText className="mx-auto text-indigo-500 mb-3" size={48} />
              <h3 className="text-xl font-bold mb-2">
                批次匯入書籍資料 (CSV / Excel)
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                您可以直接上傳經銷商提供的 <b>.xls</b> 或 <b>.xlsx</b>{" "}
                檔案（完全支援：獨書網出貨單），
                <br />
                系統會自動對應欄位、並主動略過「缺書記錄」進行智慧合併！
              </p>

              <button
                onClick={downloadCSVTemplate}
                className="mb-4 text-sm text-blue-600 hover:underline font-medium"
              >
                + 點此下載公版欄位範本 (若需自行整理)
              </button>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 hover:bg-gray-50 transition relative overflow-hidden">
                <input
                  type="file"
                  onChange={handleBatchUpload}
                  accept=".csv, .xls, .xlsx"
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                />
                <div className="flex flex-col items-center justify-center text-indigo-600 font-medium relative z-0">
                  {isUploading ? (
                    <>
                      <Cloud className="mb-2 animate-bounce" size={24} />
                      正在解析 Excel 檔案...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="mb-2" size={24} />
                      點選此處上傳 CSV 或 Excel 檔案
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded w-full transition disabled:opacity-50"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cloud Import Modal */}
        {showCloudImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-xl">
              <div className="flex items-center text-green-600 mb-3">
                <Cloud size={32} className="mr-3" />
                <h3 className="text-xl font-bold text-gray-800">
                  從 Google 試算表批次進貨
                </h3>
              </div>
              <p className="text-sm text-gray-500 mb-4 bg-yellow-50 p-3 rounded border border-yellow-200">
                <span className="font-bold text-yellow-700">
                  智慧合併機制：
                </span>
                <br />
                系統若比對到相同的書名或
                ISBN，會自動將試算表上的數量「累加」到現有庫存中，並更新成本與售價，不用擔心蓋掉原有的庫存數字！
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    步驟一：建立進貨單
                  </label>
                  <p className="text-sm text-gray-600 mb-2">
                    在您的 Google 試算表中建立與 CSV
                    範本相同的欄位結構並填寫新進書籍。
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    步驟二：發佈為 CSV
                  </label>
                  <p className="text-sm text-gray-600 mb-2">
                    點選試算表左上角「檔案」➔「共用」➔「發佈到網路」。
                    <br />
                    選擇您的工作表，並將格式改為 <b>CSV (逗號分隔值)</b>{" "}
                    後點擊發佈。
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    步驟三：貼上連結
                  </label>
                  <input
                    type="text"
                    value={cloudUrl}
                    onChange={(e) => setCloudUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/e/2PACX.../pub?output=csv"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCloudImportModal(false)}
                  disabled={isCloudLoading}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition"
                >
                  取消
                </button>
                <button
                  onClick={handleCloudImport}
                  disabled={isCloudLoading || !cloudUrl}
                  className={`px-6 py-2 text-white rounded transition flex items-center ${
                    isCloudLoading || !cloudUrl
                      ? "bg-green-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isCloudLoading ? "讀取並合併中..." : "開始同步進貨"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- View: Market Management ---
  const MarketView = () => {
    const [selectedMarketId, setSelectedMarketId] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const activeMarket = markets.find((m) => m.id === selectedMarketId);

    // Sort markets to show active ones first
    const sortedMarkets = [...markets].sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (a.status !== "active" && b.status === "active") return 1;
      return new Date(b.date) - new Date(a.date);
    });

    const handleCreateMarket = (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const newMarket = {
        id: "m" + Date.now(),
        name: formData.get("name"),
        date: formData.get("date"),
        status: "draft", // draft, active, completed
        books: [], // { bookId, packedQty, soldQty }
      };
      const updatedMarkets = [...markets, newMarket];
      updateStore({ markets: updatedMarkets });
      setShowCreateModal(false);
      setSelectedMarketId(newMarket.id);
    };

    const toggleBookForMarket = (bookId, currentQty) => {
      if (!activeMarket) return;

      let updatedBooks = [...activeMarket.books];
      const existingIdx = updatedBooks.findIndex((b) => b.bookId === bookId);

      if (existingIdx >= 0) {
        if (currentQty === 0) {
          updatedBooks.splice(existingIdx, 1);
        } else {
          updatedBooks[existingIdx].packedQty = currentQty;
        }
      } else if (currentQty > 0) {
        updatedBooks.push({ bookId, packedQty: currentQty, soldQty: 0 });
      }

      updateStore({
        markets: markets.map((m) =>
          m.id === activeMarket.id
            ? { ...activeMarket, books: updatedBooks }
            : m
        ),
      });
    };

    const startMarket = () => {
      if (!activeMarket || activeMarket.books.length === 0) {
        alert("請先加入要帶去市集的書籍！");
        return;
      }

      // Deduct from Tainan stock temporarily
      const updatedBooks = books.map((book) => {
        const marketBook = activeMarket.books.find(
          (mb) => mb.bookId === book.id
        );
        if (marketBook) {
          return {
            ...book,
            stockTainan: book.stockTainan - marketBook.packedQty,
          };
        }
        return book;
      });

      updateStore({
        books: updatedBooks,
        markets: markets.map((m) =>
          m.id === activeMarket.id ? { ...activeMarket, status: "active" } : m
        ),
      });
      alert(
        "已確認打包！相關書籍庫存已從台南總店扣除，請至「POS 門市結帳」切換門市開始結帳。"
      );
    };

    const endMarket = () => {
      let newSales = [];
      const updatedBooks = books.map((book) => {
        const marketBook = activeMarket.books.find(
          (mb) => mb.bookId === book.id
        );
        if (marketBook) {
          // Add sold to sales history
          if (marketBook.soldQty > 0) {
            newSales.push({
              id: "s" + Date.now() + Math.random(),
              date: new Date().toISOString().split("T")[0],
              bookId: book.id,
              quantity: marketBook.soldQty,
              location: `市集：${activeMarket.name}`,
              total: book.price * marketBook.soldQty,
            });
          }
          // Return unsold to Tainan
          const unsoldQty = marketBook.packedQty - marketBook.soldQty;
          return { ...book, stockTainan: book.stockTainan + unsoldQty };
        }
        return book;
      });

      updateStore({
        books: updatedBooks,
        sales: [...sales, ...newSales],
        markets: markets.map((m) =>
          m.id === activeMarket.id
            ? { ...activeMarket, status: "completed" }
            : m
        ),
      });

      // 觸發 Webhook：市集結算後自動上傳至 Google Sheets
      if (newSales.length > 0) {
        sendToGoogleSheets(newSales);
      }

      alert("市集已結束！未售出書籍已退回台南總店庫存，銷售紀錄已建立。");
    };

    if (activeMarket) {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedMarketId(null)}
              className="text-gray-500 hover:text-gray-800"
            >
              ← 返回市集列表
            </button>
            <h2 className="text-2xl font-bold text-gray-800">
              {activeMarket.name}
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                activeMarket.status === "draft"
                  ? "bg-yellow-100 text-yellow-800"
                  : activeMarket.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {activeMarket.status === "draft"
                ? "準備中 (打包書籍)"
                : activeMarket.status === "active"
                ? "出攤中 (POS 結帳)"
                : "已結算結束"}
            </span>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            {activeMarket.status === "draft" && (
              <div className="mb-6 pb-6 border-b">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    步驟 1：選擇要帶去的書籍
                  </h3>
                  <button
                    onClick={startMarket}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-sm"
                  >
                    確認打包，開始出攤
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {books
                    .filter((b) => b.stockTainan > 0)
                    .map((book) => {
                      const marketBook = activeMarket.books.find(
                        (mb) => mb.bookId === book.id
                      );
                      const packedQty = marketBook ? marketBook.packedQty : 0;
                      return (
                        <div
                          key={book.id}
                          className="border rounded-lg p-3 flex justify-between items-center bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm truncate">
                              {book.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              庫存: {book.stockTainan}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              max={book.stockTainan}
                              value={packedQty}
                              onChange={(e) =>
                                toggleBookForMarket(
                                  book.id,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-16 border rounded p-1 text-center text-sm"
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {activeMarket.status === "active" && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4 p-4 bg-green-50 rounded-lg border border-green-100">
                  <div>
                    <h3 className="font-bold text-green-800 mb-1">
                      正在出攤中！
                    </h3>
                    <p className="text-sm text-green-700">
                      請前往「POS 門市結帳」頁面，並在右上角將門市切換為「市集：
                      {activeMarket.name}」以進行結帳。
                    </p>
                  </div>
                  <button
                    onClick={endMarket}
                    className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 font-medium"
                  >
                    市集結束，自動結算
                  </button>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {activeMarket.status === "draft"
                  ? "已打包清單"
                  : "市集銷售與庫存狀態"}
              </h3>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 border-b">
                    <th className="p-3 font-medium">書名</th>
                    <th className="p-3 font-medium text-center">攜出數量</th>
                    {activeMarket.status !== "draft" && (
                      <>
                        <th className="p-3 font-medium text-center text-green-600">
                          售出數量
                        </th>
                        <th className="p-3 font-medium text-center">
                          剩餘退回
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {activeMarket.books.map((mb) => {
                    const book = getBook(mb.bookId);
                    return (
                      <tr key={mb.bookId} className="border-b">
                        <td className="p-3">{book.title}</td>
                        <td className="p-3 text-center">{mb.packedQty}</td>
                        {activeMarket.status !== "draft" && (
                          <>
                            <td className="p-3 text-center font-bold text-green-600">
                              {mb.soldQty}
                            </td>
                            <td className="p-3 text-center text-gray-500">
                              {mb.packedQty - mb.soldQty}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">市集出攤管理</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition"
          >
            <Plus size={18} className="mr-2" />
            建立新市集紀錄
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMarkets.map((market) => (
            <div
              key={market.id}
              onClick={() => setSelectedMarketId(market.id)}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <Tent size={24} />
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    market.status === "draft"
                      ? "bg-yellow-100 text-yellow-800"
                      : market.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {market.status === "draft"
                    ? "準備中"
                    : market.status === "active"
                    ? "出攤中"
                    : "已結束"}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1 truncate">
                {market.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{market.date}</p>
              <div className="text-sm text-gray-600 border-t pt-3">
                共攜帶 {market.books.length} 種書籍
              </div>
            </div>
          ))}
          {markets.length === 0 && (
            <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-xl border border-dashed">
              目前沒有市集紀錄，點擊右上角建立！
            </div>
          )}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
              <h3 className="text-xl font-bold mb-4">建立新市集</h3>
              <form onSubmit={handleCreateMarket} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    市集名稱 *
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="例如：草地書香市集"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    出攤日期 *
                  </label>
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    建立市集
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- View: Reports ---
  const ReportsView = () => {
    const exportCSV = () => {
      if (sales.length === 0) {
        alert("尚無銷售紀錄可匯出");
        return;
      }

      const headers = [
        "銷售日期",
        "地點/市集",
        "書名",
        "來源類型",
        "數量",
        "單筆總金額",
      ];
      const csvData = sales.map((s) => {
        const book = getBook(s.bookId);
        const isCustom = s.bookId.startsWith("custom_");
        return [
          s.date,
          s.location === "Pingtung"
            ? "屏東分店"
            : s.location === "Tainan"
            ? "台南總店"
            : s.location,
          isCustom ? s.title : book?.title || "未知",
          isCustom
            ? "其他(咖啡/雜貨)"
            : book?.type === "consignment"
            ? "寄售"
            : "經銷商",
          s.quantity,
          s.total,
        ].join(",");
      });

      const blob = new Blob(
        ["\uFEFF" + headers.join(",") + "\n" + csvData.join("\n")],
        { type: "text/csv;charset=utf-8;" }
      );
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `銷售報表_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">銷售報表</h2>
          <button
            onClick={exportCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center transition"
          >
            <FileSpreadsheet size={18} className="mr-2" />
            匯出 Excel (CSV)
          </button>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b">
                  <th className="p-3 font-medium">日期</th>
                  <th className="p-3 font-medium">銷售地點 / 市集</th>
                  <th className="p-3 font-medium">書名 / 商品名稱</th>
                  <th className="p-3 font-medium">來源</th>
                  <th className="p-3 font-medium text-right">數量</th>
                  <th className="p-3 font-medium text-right">總金額</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-gray-500">
                      目前尚無銷售紀錄
                    </td>
                  </tr>
                ) : (
                  [...sales].reverse().map((sale) => {
                    // 將最新銷售放最上面
                    const isCustom = sale.bookId.startsWith("custom_");
                    const book = isCustom ? null : getBook(sale.bookId);
                    return (
                      <tr key={sale.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-gray-600">{sale.date}</td>
                        <td className="p-3">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm">
                            {sale.location === "Pingtung"
                              ? "屏東分店"
                              : sale.location === "Tainan"
                              ? "台南總店"
                              : sale.location}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-gray-800">
                          {isCustom ? (
                            <span className="flex items-center text-orange-700">
                              <Coffee size={16} className="mr-1" /> {sale.title}
                            </span>
                          ) : (
                            book?.title || "已刪除的書籍"
                          )}
                        </td>
                        <td className="p-3 text-sm text-gray-500">
                          {isCustom
                            ? "店內其他商品"
                            : book?.type === "consignment"
                            ? "寄售"
                            : "經銷商"}
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {sale.quantity}
                        </td>
                        <td className="p-3 text-right font-bold text-gray-800">
                          NT$ {sale.total}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // --- View: Settings & Backup ---
  const SettingsView = () => {
    const handleExportData = () => {
      const data = { books, markets, sales };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `心傳租書社_系統備份_${
        new Date().toISOString().split("T")[0]
      }.json`;
      link.click();
    };

    const handleImportData = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.books && data.markets && data.sales) {
            updateStore({
              books: data.books,
              markets: data.markets,
              sales: data.sales,
            });
            alert("✅ 系統資料還原成功！");
          } else {
            alert("❌ 檔案格式錯誤，請上傳正確的系統備份檔。");
          }
        } catch (err) {
          alert("❌ 檔案解析失敗！");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">系統設定與備份</h2>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-3xl">
          <div className="flex items-center text-indigo-600 mb-4">
            <DownloadCloud size={28} className="mr-3" />
            <h3 className="text-xl font-bold text-gray-800">資料庫安全備份</h3>
          </div>
          <p className="text-gray-600 mb-6 leading-relaxed">
            強烈建議您定期點擊{" "}
            <strong className="text-indigo-600">下載系統備份</strong>
            。這是一份包含您所有書籍庫存、市集紀錄與銷售報表的完整資料。下次若需要轉移帳號或重新部署時，只要{" "}
            <strong className="text-indigo-600">還原系統資料</strong>
            ，所有心血就會立刻無縫恢復！
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleExportData}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 flex items-center justify-center shadow-md font-bold transition"
            >
              <DownloadCloud className="mr-2" size={20} /> 下載系統備份 (.json)
            </button>
            <label className="bg-white text-indigo-600 border-2 border-indigo-200 px-6 py-3 rounded-xl hover:bg-indigo-50 flex items-center justify-center cursor-pointer transition shadow-sm font-bold">
              <UploadCloud className="mr-2" size={20} /> 還原系統資料
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportData}
              />
            </label>
          </div>
        </div>
      </div>
    );
  };

  // --- View: POS Checkout ---
  const POSView = () => {
    // 購物車與搜尋的狀態
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    // 🌟 新增：自訂商品模態框狀態
    const [showCustomItemModal, setShowCustomItemModal] = useState(false);

    const activeMarkets = markets.filter((m) => m.status === "active");

    const getAvailableStock = (bookId) => {
      // 處理自訂商品 (無庫存上限)
      if (bookId.startsWith("custom_")) return 999;

      const book = getBook(bookId);
      if (!book) return 0;
      if (posLocation === "Tainan") return book.stockTainan;
      if (posLocation === "Pingtung") return book.stockPingtung;
      if (posLocation.startsWith("market-")) {
        const marketId = posLocation.split("market-")[1];
        const market = markets.find((m) => m.id === marketId);
        const marketBook = market?.books.find((b) => b.bookId === bookId);
        return marketBook ? marketBook.packedQty - marketBook.soldQty : 0;
      }
      return 0;
    };

    const displayBooks = books.filter((b) => {
      const matchSearch =
        b.title.includes(searchTerm) ||
        b.isbn.includes(searchTerm) ||
        b.author.includes(searchTerm);
      if (!matchSearch) return false;

      if (posLocation.startsWith("market-")) {
        const marketId = posLocation.split("market-")[1];
        const market = markets.find((m) => m.id === marketId);
        return market?.books.some((mb) => mb.bookId === b.id);
      }
      return true;
    });

    const handleLocationChange = (e) => {
      if (cart.length > 0) {
        if (window.confirm("切換門市將會清空目前的購物車，確定要切換嗎？")) {
          setCart([]);
          setPosLocation(e.target.value);
        }
      } else {
        setPosLocation(e.target.value);
      }
    };

    const addToCart = (item) => {
      const isCustom = item.id.startsWith("custom_");
      const availableStock = isCustom ? 999 : getAvailableStock(item.id);
      const existingItem = cart.find((c) => c.bookId === item.id);
      const currentQty = existingItem ? existingItem.quantity : 0;

      if (!isCustom && currentQty >= availableStock) {
        alert("該門市/市集庫存不足！");
        return;
      }

      if (existingItem) {
        setCart(
          cart.map((c) =>
            c.bookId === item.id ? { ...c, quantity: c.quantity + 1 } : c
          )
        );
      } else {
        setCart([
          ...cart,
          {
            bookId: item.id,
            title: item.title,
            price: item.price,
            quantity: 1,
            isCustom: isCustom,
          },
        ]);
      }
    };

    // 🌟 處理自訂商品加入購物車
    const handleAddCustomItem = (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const title = formData.get("title");
      const price = Number(formData.get("price"));

      addToCart({
        id: "custom_" + Date.now(), // 給予獨特 ID 標記為自訂商品
        title: title,
        price: price,
      });
      setShowCustomItemModal(false);
    };

    const updateCartQty = (bookId, newQty) => {
      if (newQty <= 0) {
        setCart(cart.filter((item) => item.bookId !== bookId));
        return;
      }
      const isCustom = bookId.startsWith("custom_");
      const availableStock = isCustom ? 999 : getAvailableStock(bookId);
      if (!isCustom && newQty > availableStock) {
        alert("該門市/市集庫存不足！");
        return;
      }
      setCart(
        cart.map((item) =>
          item.bookId === bookId ? { ...item, quantity: newQty } : item
        )
      );
    };

    const totalAmount = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const handleCheckout = () => {
      if (cart.length === 0) return;

      if (posLocation.startsWith("market-")) {
        const marketId = posLocation.split("market-")[1];
        const market = markets.find((m) => m.id === marketId);

        // 更新市集售出數量 (略過自訂商品)
        const updatedBooks = market.books.map((mb) => {
          const cartItem = cart.find(
            (item) => item.bookId === mb.bookId && !item.isCustom
          );
          if (cartItem) {
            return { ...mb, soldQty: mb.soldQty + cartItem.quantity };
          }
          return mb;
        });

        // 獨立出市集的「自訂商品」銷售紀錄
        const customSales = cart
          .filter((item) => item.isCustom)
          .map((item, index) => ({
            id: "s_custom_" + Date.now() + index,
            date: new Date().toISOString().split("T")[0],
            bookId: item.bookId,
            title: item.title,
            quantity: item.quantity,
            location: `市集：${market.name}`,
            total: item.price * item.quantity,
          }));

        updateStore({
          markets: markets.map((m) =>
            m.id === marketId ? { ...market, books: updatedBooks } : m
          ),
          sales: [...sales, ...customSales], // 把市集的自訂商品立刻寫入總報表
        });

        // 觸發 Webhook (僅傳送自訂商品，書籍會等市集結算時再傳)
        if (customSales.length > 0) sendToGoogleSheets(customSales);

        alert(
          `市集結帳成功！總金額 NT$ ${totalAmount}\n已自動連動「${market.name}」的售出數量 (自訂商品已寫入報表)。\n請於出攤結束後至「市集出攤管理」統一結算書籍報表。`
        );
      } else {
        // 一般門市結帳：扣除對應門市庫存 (略過自訂商品)
        const updatedBooks = books.map((book) => {
          const cartItem = cart.find(
            (item) => item.bookId === book.id && !item.isCustom
          );
          if (cartItem) {
            if (posLocation === "Tainan") {
              return {
                ...book,
                stockTainan: book.stockTainan - cartItem.quantity,
              };
            } else {
              return {
                ...book,
                stockPingtung: book.stockPingtung - cartItem.quantity,
              };
            }
          }
          return book;
        });

        // 產生銷售紀錄 (包含書籍與自訂商品)
        const newSales = cart.map((item, index) => ({
          id: "s" + Date.now() + index,
          date: new Date().toISOString().split("T")[0],
          bookId: item.bookId,
          title: item.title, // 紀錄自訂商品名稱
          quantity: item.quantity,
          location: posLocation === "Tainan" ? "台南總店" : "屏東分店",
          total: item.price * item.quantity,
        }));

        updateStore({
          books: updatedBooks,
          sales: [...sales, ...newSales],
        });

        // 觸發 Webhook：門市結帳後自動上傳至 Google Sheets
        sendToGoogleSheets(newSales);

        alert(
          `結帳成功！總金額 NT$ ${totalAmount}\n庫存已扣除並自動寫入銷售報表。`
        );
      }

      setCart([]);
      setSearchTerm("");
    };

    return (
      <div className="h-full flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">POS 門市結帳</h2>
          <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border shadow-sm">
            <MapPin size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-600">
              結帳門市：
            </span>
            <select
              value={posLocation}
              onChange={handleLocationChange}
              className="border-none bg-transparent focus:ring-0 text-blue-600 font-bold cursor-pointer outline-none"
            >
              <option value="Tainan">台南總店</option>
              <option value="Pingtung">屏東分店</option>
              {activeMarkets.map((m) => (
                <option key={m.id} value={`market-${m.id}`}>
                  市集：{m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 gap-6 min-h-0">
          {/* 左側：商品選擇與搜尋 */}
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b flex space-x-3">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="掃描 ISBN 條碼或搜尋書名、作者..."
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {/* 🌟 新增：自訂商品結帳按鈕 */}
              <button
                onClick={() => setShowCustomItemModal(true)}
                className="bg-orange-100 text-orange-700 px-4 py-3 rounded-lg hover:bg-orange-200 flex items-center font-bold transition shadow-sm border border-orange-200 shrink-0"
              >
                <Coffee size={20} className="mr-2" />
                其他商品
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {displayBooks.map((book) => {
                  const stock = getAvailableStock(book.id);
                  const disabled = stock === 0;
                  return (
                    <div
                      key={book.id}
                      onClick={() => !disabled && addToCart(book)}
                      className={`p-4 rounded-xl border bg-white flex flex-col justify-between transition-all ${
                        disabled
                          ? "opacity-50 cursor-not-allowed bg-gray-100"
                          : "cursor-pointer hover:border-blue-500 hover:shadow-md active:scale-95"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-gray-800 line-clamp-2 leading-tight">
                          {book.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-2 truncate">
                          {book.author}
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-4">
                        <span className="text-blue-600 font-bold text-lg">
                          NT$ {book.price}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            stock > 5
                              ? "bg-green-100 text-green-700"
                              : stock > 0
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          庫存: {stock}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {displayBooks.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Book size={48} className="mb-4 opacity-20" />
                  <p>找不到符合的書籍</p>
                </div>
              )}
            </div>
          </div>

          {/* 右側：購物車與結帳 (寬度固定) */}
          <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden shrink-0">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center">
                <ShoppingCart className="mr-2 text-indigo-600" size={20} />
                結帳清單
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {cart.map((item) => (
                <div
                  key={item.bookId}
                  className="flex flex-col p-3 border-b hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm text-gray-800 pr-2 leading-tight">
                      {item.isCustom ? (
                        <span className="text-orange-600 mr-1">[其他]</span>
                      ) : null}
                      {item.title}
                    </span>
                    <button
                      onClick={() => updateCartQty(item.bookId, 0)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-600 font-bold">
                      NT$ {item.price}
                    </span>
                    <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() =>
                          updateCartQty(item.bookId, item.quantity - 1)
                        }
                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:text-blue-600 font-bold"
                      >
                        -
                      </button>
                      <span className="font-bold text-sm w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateCartQty(item.bookId, item.quantity + 1)
                        }
                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:text-blue-600 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  購物車是空的
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600 font-medium">總計金額</span>
                <span className="text-3xl font-extrabold text-gray-900">
                  NT$ {totalAmount}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center transition-all ${
                  cart.length > 0
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-[0.98]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <CreditCard className="mr-2" size={20} />
                確認結帳
              </button>
            </div>
          </div>
        </div>

        {/* 🌟 新增：自訂商品模態框 */}
        {showCustomItemModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-xl border-t-4 border-orange-500">
              <h3 className="text-xl font-bold mb-2 flex items-center text-orange-700">
                <Coffee className="mr-2" size={24} />
                加入店內其他商品
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                輸入商品名稱與金額，即可一併結帳並寫入報表。
              </p>
              <form onSubmit={handleAddCustomItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    商品名稱
                  </label>
                  <input
                    name="title"
                    required
                    placeholder="例如：熱美式 / 文創貼紙"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    結帳金額 (單價)
                  </label>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    required
                    placeholder="例如：120"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-orange-500 text-lg font-bold text-blue-600 bg-gray-50"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCustomItemModal(false)}
                    className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 shadow-md font-bold transition"
                  >
                    加入購物車
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- Main Layout ---
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0 shadow-sm z-10">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-extrabold flex items-center text-gray-900 tracking-tight">
            <Library className="mr-2 text-indigo-600" size={24} />
            心傳租書社
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`w-full flex items-center p-3 rounded-xl transition-all ${
              activeTab === "inventory"
                ? "bg-indigo-50 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Book className="mr-3" size={20} /> 總庫存管理
          </button>
          <button
            onClick={() => setActiveTab("market")}
            className={`w-full flex items-center p-3 rounded-xl transition-all ${
              activeTab === "market"
                ? "bg-indigo-50 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Tent className="mr-3" size={20} /> 市集出攤管理
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`w-full flex items-center p-3 rounded-xl transition-all ${
              activeTab === "reports"
                ? "bg-indigo-50 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <FileSpreadsheet className="mr-3" size={20} /> 銷售報表匯出
          </button>

          <div className="my-4 border-t border-gray-100"></div>

          <button
            onClick={() => setActiveTab("pos")}
            className={`w-full flex items-center p-3 rounded-xl transition-all ${
              activeTab === "pos"
                ? "bg-emerald-50 text-emerald-700 font-bold shadow-sm ring-1 ring-emerald-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <ShoppingCart className="mr-3" size={20} /> POS 門市結帳
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center p-3 rounded-xl transition-all ${
              activeTab === "settings"
                ? "bg-indigo-50 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Settings className="mr-3" size={20} /> 系統設定與備份
          </button>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center text-sm text-gray-700 mb-3 overflow-hidden bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
            <div className="bg-indigo-100 p-1.5 rounded-md mr-2 shrink-0">
              <User size={16} className="text-indigo-600" />
            </div>
            <span className="truncate font-medium">
              {user.email || "管理員"}
            </span>
          </div>
          <button
            onClick={() => {
              if (window.confirm("確定要登出嗎？")) signOut(auth);
            }}
            className="w-full flex items-center justify-center p-2.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition font-medium border border-transparent hover:border-red-100"
          >
            <LogOut size={16} className="mr-2" /> 登出系統
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-hidden flex flex-col bg-slate-50/50">
        {activeTab === "inventory" && <InventoryView />}
        {activeTab === "market" && <MarketView />}
        {activeTab === "reports" && <ReportsView />}
        {activeTab === "pos" && <POSView />}
        {activeTab === "settings" && <SettingsView />}
      </main>
    </div>
  );
}
