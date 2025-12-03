import { useState, useEffect } from "react";
import { Form, Input, DatePicker, Select, Button, message, Modal } from "antd";
import dayjs from "dayjs";
import "./ProvinceTasks.css";

const { TextArea } = Input;
const { Option } = Select;

const ProvinceTasks = ({ provinceName, tasks, onSave, onClose }) => {
  const [taskList, setTaskList] = useState(tasks || []);
  const [editingTask, setEditingTask] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form] = Form.useForm();
  const [formData, setFormData] = useState({
    versionName: "",
    workPlan: "",
    releaseDate: null,
    status: "进行中",
    notes: "",
    zentaoUrl: "",
  });

  useEffect(() => {
    setTaskList(tasks || []);
  }, [tasks]);

  const handleSave = () => {
    onSave(provinceName, taskList);
  };

  const handleAddTask = async () => {
    try {
      const values = await form.validateFields();
      const newTask = {
        id: Date.now(),
        versionName: values.versionName,
        workPlan: values.workPlan || "",
        releaseDate: values.releaseDate
          ? values.releaseDate.format("YYYY-MM-DD")
          : "",
        status: values.status,
        notes: values.notes || "",
        zentaoUrl: values.zentaoUrl || "",
        createdAt: new Date().toISOString(),
      };
      const updatedTasks = [...taskList, newTask];
      setTaskList(updatedTasks);
      form.resetFields();
      setIsAdding(false);
      onSave(provinceName, updatedTasks);
      message.success("任务添加成功");
    } catch (error) {
      console.error("验证失败:", error);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task.id);
    form.setFieldsValue({
      versionName: task.versionName,
      workPlan: task.workPlan || "",
      releaseDate: task.releaseDate ? dayjs(task.releaseDate) : null,
      status: task.status,
      notes: task.notes || "",
      zentaoUrl: task.zentaoUrl || "",
    });
  };

  const handleUpdateTask = async () => {
    try {
      const values = await form.validateFields();
      const updatedTasks = taskList.map((task) =>
        task.id === editingTask
          ? {
              ...task,
              versionName: values.versionName,
              workPlan: values.workPlan || "",
              releaseDate: values.releaseDate
                ? values.releaseDate.format("YYYY-MM-DD")
                : "",
              status: values.status,
              notes: values.notes || "",
              zentaoUrl: values.zentaoUrl || "",
            }
          : task
      );
      setTaskList(updatedTasks);
      onSave(provinceName, updatedTasks);
      form.resetFields();
      setEditingTask(null);
      message.success("任务更新成功");
    } catch (error) {
      console.error("验证失败:", error);
    }
  };

  const handleDeleteTask = (taskId) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个任务吗？",
      onOk: () => {
        const updatedTasks = taskList.filter((task) => task.id !== taskId);
        setTaskList(updatedTasks);
        onSave(provinceName, updatedTasks);
        message.success("任务已删除");
      },
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingTask(null);
    form.resetFields();
  };

  // 按发版时间排序
  const sortedTasks = [...taskList].sort((a, b) => {
    if (!a.releaseDate) return 1;
    if (!b.releaseDate) return -1;
    return new Date(a.releaseDate) - new Date(b.releaseDate);
  });

  // 检查是否即将发版（7天内）
  const isUpcoming = (releaseDate) => {
    if (!releaseDate) return false;
    const release = new Date(releaseDate);
    const today = new Date();
    const diffTime = release - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  return (
    <div className="province-tasks">
      <div className="province-tasks-header">
        <h2>{provinceName}</h2>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="tasks-content">
        {!isAdding && editingTask === null && (
          <button className="add-task-btn" onClick={() => setIsAdding(true)}>
            + 添加任务卡片
          </button>
        )}

        {(isAdding || editingTask !== null) && (
          <div className="task-form">
            <h3>{editingTask ? "编辑任务" : "添加新任务"}</h3>
            <Form form={form} layout="vertical">
              <Form.Item
                label="版本名称"
                name="versionName"
                rules={[{ required: true, message: "请输入版本名称" }]}
              >
                <Input placeholder="请输入版本名称" />
              </Form.Item>

              <Form.Item label="工作安排" name="workPlan">
                <TextArea placeholder="描述工作安排和计划" rows={3} />
              </Form.Item>

              <div className="form-row">
                <Form.Item
                  label="发版时间"
                  name="releaseDate"
                  className="form-item-inline"
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    placeholder="选择发版时间"
                  />
                </Form.Item>

                <Form.Item
                  label="状态"
                  name="status"
                  className="form-item-inline"
                >
                  <Select>
                    <Option value="待开始">待开始</Option>
                    <Option value="进行中">进行中</Option>
                    <Option value="已完成">已完成</Option>
                    <Option value="已延期">已延期</Option>
                  </Select>
                </Form.Item>
              </div>

              <Form.Item label="备注" name="notes">
                <TextArea placeholder="其他备注信息" rows={2} />
              </Form.Item>

              <Form.Item label="禅道 URL" name="zentaoUrl">
                <Input placeholder="例如：https://zentao.example.com/task-view-123.html" />
              </Form.Item>

              <div className="form-actions">
                <Button
                  type="primary"
                  onClick={editingTask ? handleUpdateTask : handleAddTask}
                >
                  {editingTask ? "更新" : "添加"}
                </Button>
                <Button onClick={handleCancel}>取消</Button>
              </div>
            </Form>
          </div>
        )}

        <div className="tasks-list">
          {sortedTasks.length === 0 ? (
            <div className="no-tasks">
              <p>该省份还没有任务卡片</p>
              <p className="hint">点击上方"添加任务卡片"按钮开始添加</p>
            </div>
          ) : (
            sortedTasks.map((task) => (
              <div
                key={task.id}
                className={`task-card ${
                  isUpcoming(task.releaseDate) ? "upcoming" : ""
                } ${task.status === "已完成" ? "completed" : ""}`}
              >
                <div className="task-card-header">
                  <h4>{task.versionName}</h4>
                  <span className={`status-badge status-${task.status}`}>
                    {task.status}
                  </span>
                </div>

                {task.workPlan && (
                  <div className="task-item">
                    <strong>工作安排：</strong>
                    <p>{task.workPlan}</p>
                  </div>
                )}

                {task.releaseDate && (
                  <div className="task-item">
                    <strong>发版时间：</strong>
                    <span className="release-date">
                      {new Date(task.releaseDate).toLocaleDateString("zh-CN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      {isUpcoming(task.releaseDate) && (
                        <span className="upcoming-badge">即将发版</span>
                      )}
                    </span>
                  </div>
                )}

                {task.notes && (
                  <div className="task-item">
                    <strong>备注：</strong>
                    <p>{task.notes}</p>
                  </div>
                )}

                {task.zentaoUrl && (
                  <div className="task-item">
                    <strong>禅道链接：</strong>
                    <Button
                      type="link"
                      href={task.zentaoUrl}
                      target="_blank"
                      className="zentao-link-btn"
                    >
                      打开禅道任务
                    </Button>
                  </div>
                )}

                <div className="task-card-actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEditTask(task)}
                  >
                    编辑
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProvinceTasks;

