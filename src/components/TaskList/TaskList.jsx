import { Modal, Button, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import "./TaskList.css";

const TaskList = ({
  visible,
  onClose,
  title,
  tasks,
  provinceData,
  onDeleteTask,
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return "未设置";
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDelete = (task, province) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除任务"${task.versionName}"吗？`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: () => {
        if (onDeleteTask && province) {
          onDeleteTask(task.id, province);
          message.success("任务已删除");
        }
      },
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
              const province =
                task.provinceName ||
                Object.keys(provinceData).find((p) =>
                  provinceData[p]?.some((t) => t.id === task.id)
                );

              return (
                <div key={task.id || index} className="task-list-item">
                  <div className="task-item-header">
                    <h4>{task.versionName}</h4>
                    <div className="task-item-meta">
                      <span className="task-province">
                        {province || "未知省份"}
                      </span>
                      <span className={`status-badge status-${task.status}`}>
                        {task.status}
                      </span>
                      {province && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(task, province)}
                          className="task-delete-btn"
                          title="删除任务"
                        />
                      )}
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
