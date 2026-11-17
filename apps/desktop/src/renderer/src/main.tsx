import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <main>
      <p className="eyebrow">THỰC HÀNH LẬP TRÌNH MẠNG · NHÓM 4</p>
      <h1>Online Exam</h1>
      <p className="intro">Thi trắc nghiệm và luyện tập qua mạng LAN.</p>
      <section aria-label="Trạng thái dự án">
        <span className="badge">Khung ứng dụng</span>
        <h2>Nền tảng đã sẵn sàng để phát triển</h2>
        <p>Chức năng tài khoản, phòng thi và làm bài sẽ được triển khai ở các mốc tiếp theo.</p>
        <p className="status">{window.desktop?.stage === 'foundation'
          ? 'Ứng dụng chưa kết nối máy chủ.'
          : 'Hãy mở bằng Electron để sử dụng ứng dụng desktop.'}</p>
      </section>
      <footer>Nguyễn Minh Quân · Đặng Hoàng Quân</footer>
    </main>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing renderer root.');
createRoot(root).render(<StrictMode><App /></StrictMode>);
