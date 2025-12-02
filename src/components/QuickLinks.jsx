import { useState, useEffect } from "react";
import { Input, Button, Tag, Modal, Form, message } from "antd";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import "./QuickLinks.css";

const QuickLinks = () => {
  const [links, setLinks] = useState(() => {
    const saved = localStorage.getItem("quickLinks");
    return saved ? JSON.parse(saved) : [];
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    localStorage.setItem("quickLinks", JSON.stringify(links));
  }, [links]);

  const handleAddLink = async () => {
    try {
      const values = await form.validateFields();
      const newLink = {
        id: Date.now(),
        name: values.name,
        url: values.url,
      };
      setLinks((prev) => [...prev, newLink]);
      form.resetFields();
      setIsModalVisible(false);
      message.success("添加成功");
    } catch (error) {
      console.error("验证失败:", error);
    }
  };

  const handleDeleteLink = (id) => {
    setLinks((prev) => prev.filter((link) => link.id !== id));
    message.success("删除成功");
  };

  const handleLinkClick = (url) => {
    // 确保URL包含协议
    let finalUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      finalUrl = "https://" + url;
    }
    window.open(finalUrl, "_blank");
  };

  return (
    <div className="quick-links">
      <div className="quick-links-header">
        <h3>快速链接</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="small"
          onClick={() => setIsModalVisible(true)}
        >
          添加
        </Button>
      </div>
      <div className="quick-links-tags">
        {links.length === 0 ? (
          <div className="empty-links">点击"添加"按钮添加快速链接</div>
        ) : (
          links.map((link) => (
            <Tag
              key={link.id}
              className="quick-link-tag"
              closable
              onClose={() => handleDeleteLink(link.id)}
              onClick={() => handleLinkClick(link.url)}
            >
              {link.name}
            </Tag>
          ))
        )}
      </div>

      <Modal
        title="添加快速链接"
        open={isModalVisible}
        onOk={handleAddLink}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        okText="添加"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: "请输入链接名称" }]}
          >
            <Input placeholder="例如：GitHub" />
          </Form.Item>
          <Form.Item
            label="网址"
            name="url"
            rules={[
              { required: true, message: "请输入网址" },
              {
                validator: (_, value) => {
                  if (!value) {
                    return Promise.resolve();
                  }
                  // 简单的URL验证，只检查基本格式，避免复杂正则导致性能问题
                  const trimmedValue = value.trim();
                  // 检查是否包含点号（域名必需）或已经是http/https开头
                  if (
                    trimmedValue.includes(".") ||
                    trimmedValue.startsWith("http://") ||
                    trimmedValue.startsWith("https://")
                  ) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("请输入有效的网址（例如：github.com）")
                  );
                },
              },
            ]}
          >
            <Input placeholder="例如：github.com 或 https://github.com" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuickLinks;
