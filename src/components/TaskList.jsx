import { Modal } from "antd";
import "./TaskList.css";

const TaskList = ({ visible, onClose, title, tasks, provinceData }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "未设置";
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className="task-list-modal"
    >
      <div className="task-list-content">
        {tasks.length === 0 ? (
          <div className="empty-tasks">暂无任务</div>
        ) : (
          <div className="task-list-items">
            {tasks.map((task, index) => {
              // 找到任务所属的省份
              const province = task.provinceName || Object.keys(provinceData).find(
                (p) => provinceData[p]?.some((t) => t.id === task.id)
              );
              
              return (
                <div key={task.id || index} className="task-list-item">
                  <div className="task-item-header">
                    <h4>{task.versionName}</h4>
                    <div className="task-item-meta">
                      <span className="task-province">{province || "未知省份"}</span>
                      <span className={`status-badge status-${task.status}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                  {task.workPlan && (
                    <div className="task-item-field">
                      <strong>工作安排：</strong>
                      <p>{task.workPlan}</p>
                    </div>
                  )}
                  {task.releaseDate && (
                    <div className="task-item-field">
                      <strong>发版时间：</strong>
                      <span>{formatDate(task.releaseDate)}</span>
                    </div>
                  )}
                  {task.notes && (
                    <div className="task-item-field">
                      <strong>备注：</strong>
                      <p>{task.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TaskList;

