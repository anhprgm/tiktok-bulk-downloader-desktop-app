# Tiktok Bulk Downloader Desktop App

- Đây là 1 project để tải hàng loạt ảnh, video từ người dùng tiktok và được viết bằng ElectronJS (Vite)
- Nhiệm vụ của bạn là cải tiến, viết lại đoạn code theo yêu cầu sau:
  - Ứng dụng tải xuống này hiện tại tập trung 2 tính năng chính là tải hàng loạt ảnh/video trên trang cá nhân người dùng tiktok và tải riêng lẻ theo ID.
  - Ở mục tải hàng loạt:
    - Người dùng nhập username và khoảng thời gian delay giữa các lần gọi request (giá trị mặc định là 0).
    - Sau khi nhập xong, user click button tải xuống, app thực hiện gọi dữ liệu để lấy thông tin về các ảnh, video và hiển thị trực tiếp lên table.
    - Trong quá trình gọi dữ liệu, người dùng có thể click vào button Hủy lấy dữ liệu.
    - Sau khi có dữ liệu và không đang ở trạng thái lấy dữ liệu, xuất hiện ô input để người dùng có thể chọn thư mục để lưu file (giá trị mặc định là thư mục download của người dùng).
    - Tiếp đó, user có thể tùy chọn cấu trúc tên file để lưu (hiện dropdown để user có thể chọn và sắp xếp các trường ID, Numerical order, Description, Timestamp để cấu thành nên tên file, giá trị mặc định là Numerical order_ID).
    - Trong table, user có thể chọn từng item mà mình muốn tải hoặc chọn/hủy tất cả các item, có thể search theo ID, Description, có thể lọc theo type, và sort theo createdAt, likes, comments, views, collects. Có pagination, cho người dùng chọn số lượng hiển thị trên mỗi trang 5, 10, 20, 50 item/trang.
    - Sau khi chọn được các item tải xong, user click vào button Bắt đầu tải xuống và tải
    - Người dùng cũng có thể click Hủy bỏ tiến trình tải để ngưng tải xuống.
  - Ở mục tải riêng lẻ:
    - Người dùng nhập ID của post muốn tải và ô input chọn thư mục lưu file (giá trị mặc định là thư mục download của người dùng).
    - user có thể tùy chọn cấu trúc tên file để lưu (hiện dropdown để user có thể chọn và sắp xếp các trường ID, Numerical order, Description, Timestamp để cấu thành nên tên file, giá trị mặc định là ID).
    - User click button tải xuống và thực hiện tải xuống vào thư mục người dùng đã chọn.
  - Ngoài ra, app còn có toggle dark/light mode.
  - Tạo footer phía bên dưới, đại loại Created by @minhchi1509, kèm logo Facebook và Github của tôi (url facebook tôi là: https://www.facebook.com/minhchi1509 và github là https://github.com/minhchi1509).

- Về logic code:
  - Tôi đã viết sẵn các hàm IPC API để phục vụ cho việc gọi API lấy dữ liệu từ Tiktok, bạn có thể xem trong thư mục preload, và tôi cũng định nghĩa các interface, type response trong thư mục src\shared\types\tiktok.type.ts
  - Khi bắt đầu lấy dữ liệu, hãy gọi đến hàm TiktokService.getCredentials() để lấy cookie, sau đó gọi hàm window.api.getUserInfo(username) để lấy ra secUid người dùng, sau đó gọi hàm window.api.getUserAwemeList() và truyền vào các tham số tương ứng (giá trị cursor và maxCursor là "0", cookie là giá trị vừa lấy được ở trên).
  - Khi nhận response, nó có trả về pagination gồm hasMore, cursor, maxCursor để truyền vào tham số cho lần gọi API tiếp theo.
  - Ở phần Table, tôi đã cài đặt sẵn thư viện @tanstack/react-table để phục vụ cho việc xử lý dữ liệu trên table (search, filter, sort), hãy kết hợp với HeroUI (NextUI) để tạo ra table hoàn chỉnh.
  - Bạn có thể viết thêm các hàm ipc để xử lý việc chọn thư mục để lưu file, tải file xuống.
  - Tải file xuống hãy sử dụng axios và fs để tải dưới dạng stream để tối ưu nhất có thể.
  - Với form để user nhập username, thời gian delay, hãy validate bằng zod và hiển thị message.

- Về công nghệ:
  - UI library là HeroUI (trước đây là NextUI), TailwindCSS, Framer motion, tất cả đã được cấu hình sẵn.
  - Yêu cầu tạo giao diện đẹp chuẩn SaaS modern UI, có hiệu ứng, animation, màu app gradient nhẹ nhàng xanh lá là chủ yếu.
  - Có thể cài thêm thư viện nếu cần, package manager tôi đang sử dụng là npm.
  - Vì app tạm thời có 2 tính năng như trên nên có thể dùng component Tabs để switch qua lại.
  - Các thư viện đang ở version mới nhất nên hãy tìm trên docs chính thức của họ và áp dụng cho đúng cú pháp mới.
  - Yêu cầu viết code clean, type safe, phân chia component dễ đọc nhất có thể.

- Tài liệu tham khảo:
  - Trong thư mục references ở ngoài cùng, tôi có 2 file liên quan đến logic cũng như UI (UI nó đang sử dụng của Ant Design và framework đang là Plasmo để tạo Chrome extension).
  - Nhiệm vụ của bạn là hãy xem giao diện, logic để áp dụng và sửa lại cho đúng yêu cầu, tất nhiên chỉ là để tham khảo thôi.
