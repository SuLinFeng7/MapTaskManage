import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Input, Button, Tag, Modal, Form, message, ColorPicker } from "antd";
import { PlusOutlined, LinkOutlined, DragOutlined } from "@ant-design/icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "./QuickLinks.css";

const QuickLinks = () => {
  const [links, setLinks] = useState(() => {
    const saved = localStorage.getItem("quickLinks");
    const parsedLinks = saved ? JSON.parse(saved) : [];
    return parsedLinks.map((link) => ({
      ...link,
      color: link.color || "#667eea",
    }));
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingColorId, setEditingColorId] = useState(null);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [form] = Form.useForm();

  // 长按检测相关
  const longPressTimerRef = useRef(null);
  const isLongPressRef = useRef(false);
  const currentEditingIdRef = useRef(null);

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    localStorage.setItem("quickLinks", JSON.stringify(links));
  }, [links]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // 点击外部区域关闭颜色编辑
  useEffect(() => {
    if (!colorPickerVisible) return;

    const handleClickOutside = (e) => {
      if (
        !e.target.closest(".color-picker-wrapper") &&
        !e.target.closest(".quick-link-tag")
      ) {
        handleColorPickerClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [colorPickerVisible]);

  const handleAddLink = async () => {
    try {
      const values = await form.validateFields();
      const newLink = {
        id: Date.now(),
        name: values.name,
        url: values.url,
        color: "#667eea",
      };
      setLinks((prev) => [...prev, newLink]);
      form.resetFields();
      setIsModalVisible(false);
      message.success("添加成功");
    } catch (error) {
      console.error("验证失败:", error);
    }
  };

  const handleDragStart = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    isLongPressRef.current = false;
    currentEditingIdRef.current = null;
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setLinks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleLongPressStart = (linkId, e) => {
    if (colorPickerVisible) return;
    e?.stopPropagation();
    isLongPressRef.current = false;
    currentEditingIdRef.current = linkId;
    longPressTimerRef.current = setTimeout(() => {
      if (!colorPickerVisible) {
        isLongPressRef.current = true;
        setEditingColorId(linkId);
        setColorPickerVisible(true);
      }
    }, 1000);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    // 移除这里的 handleLinkClick 调用，避免与 onClick 重复触发
    // 点击事件由 onClick 统一处理
    isLongPressRef.current = false;
    currentEditingIdRef.current = null;
  };

  const handleColorChange = (linkId, color) => {
    setLinks((prev) =>
      prev.map((link) =>
        link.id === linkId ? { ...link, color: color.toHexString() } : link
      )
    );
  };

  const handleColorPickerClose = () => {
    setColorPickerVisible(false);
    setEditingColorId(null);
  };

  const handleDeleteLink = (e, id, linkName) => {
    e.stopPropagation();
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除快速链接"${linkName}"吗？`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: () => {
        setLinks((prev) => prev.filter((link) => link.id !== id));
        message.success("删除成功");
      },
    });
  };

  const handleLinkClick = (url) => {
    if (colorPickerVisible) return;
    let finalUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      finalUrl = "https://" + url;
    }
    window.open(finalUrl, "_blank");
  };

  // 可拖拽的链接项组件
  const SortableLinkItem = ({ link }) => {
    const tagRef = useRef(null);
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: link.id,
      disabled: colorPickerVisible,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition: isDragging ? "none" : transition,
      opacity: isDragging ? 0.8 : 1,
      zIndex: isDragging ? 1000 : "auto",
    };

    const linkColor = link.color || "#667eea";

    // 计算颜色选择器的位置
    const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
      if (editingColorId === link.id && colorPickerVisible && tagRef.current) {
        const rect = tagRef.current.getBoundingClientRect();
        setPickerPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX + rect.width / 2,
        });
      }
    }, [editingColorId, link.id, colorPickerVisible]);

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`sortable-tag-wrapper ${
          editingColorId === link.id ? "editing" : ""
        } ${isDragging ? "dragging" : ""}`}
      >
        <div ref={tagRef} style={{ display: "inline-block" }}>
          <Tag
            className="quick-link-tag"
            style={{
              background: linkColor,
              borderColor: linkColor,
              color: "white",
              cursor: "pointer",
              margin: 0,
              padding: "4px 12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseDown={(e) => {
              if (
                e.target.closest(".tag-drag-handle") ||
                e.target.closest(".tag-delete-btn") ||
                e.target.closest(".color-picker-wrapper")
              ) {
                return;
              }
              if (colorPickerVisible) return;
              handleLongPressStart(link.id, e);
            }}
            onMouseUp={(e) => {
              if (
                e.target.closest(".tag-drag-handle") ||
                e.target.closest(".tag-delete-btn") ||
                e.target.closest(".color-picker-wrapper")
              ) {
                return;
              }
              handleLongPressEnd();
            }}
            onMouseLeave={handleLongPressEnd}
            onClick={(e) => {
              // 如果点击的是颜色选择器内的任何元素，都不处理
              if (
                e.target.closest(".tag-drag-handle") ||
                e.target.closest(".tag-delete-btn") ||
                e.target.closest(".color-picker-wrapper") ||
                e.target.closest(".color-picker-close-btn")
              ) {
                e.stopPropagation();
                return;
              }
              if (colorPickerVisible || isLongPressRef.current) return;
              handleLinkClick(link.url);
            }}
          >
            {/* 拖拽手柄 */}
            <span
              className="tag-drag-handle"
              {...(colorPickerVisible || editingColorId === link.id
                ? {}
                : {
                    ...attributes,
                    ...listeners,
                  })}
              onClick={(e) => e.stopPropagation()}
              style={{
                cursor: "grab",
                display: "inline-flex",
                alignItems: "center",
                opacity: 0.7,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "0.7";
              }}
            >
              <DragOutlined />
            </span>

            {/* 链接图标和名称 */}
            <LinkOutlined />
            <span>{link.name}</span>

            {/* 颜色选择器 - 使用 Portal 渲染到 body */}
            {editingColorId === link.id &&
              colorPickerVisible &&
              createPortal(
                <div
                  className="color-picker-wrapper"
                  style={{
                    position: "absolute",
                    top: `${pickerPosition.top}px`,
                    left: `${pickerPosition.left}px`,
                    transform: "translateX(-50%)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span style={{ fontSize: "11px", color: "#666" }}>
                      选择颜色
                    </span>
                    <Button
                      type="text"
                      size="small"
                      className="color-picker-close-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleColorPickerClose();
                      }}
                      style={{
                        padding: "0 4px",
                        height: "20px",
                        fontSize: "11px",
                        lineHeight: "20px",
                      }}
                    >
                      完成
                    </Button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      width: "100%",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {[
                      "#667eea",
                      "#764ba2",
                      "#f093fb",
                      "#4facfe",
                      "#00f2fe",
                      "#43e97b",
                      "#fa709a",
                      "#fee140",
                      "#30cfd0",
                      "#a8edea",
                      "#ff6b6b",
                      "#4ecdc4",
                    ].map((color) => (
                      <div
                        key={color}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setLinks((prev) =>
                            prev.map((l) =>
                              l.id === link.id ? { ...l, color: color } : l
                            )
                          );
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        onMouseUp={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "4px",
                          backgroundColor: color,
                          cursor: "pointer",
                          border:
                            linkColor === color
                              ? "2px solid #333"
                              : "2px solid transparent",
                          boxShadow:
                            linkColor === color
                              ? "0 0 0 1px white inset"
                              : "none",
                          transition: "all 0.2s",
                          flexShrink: 0,
                          position: "relative",
                          zIndex: 1003,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      />
                    ))}
                  </div>
                </div>,
                document.body
              )}

            {/* 删除按钮 */}
            <span
              className="tag-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteLink(e, link.id, link.name);
              }}
              style={{
                cursor: "pointer",
                marginLeft: "4px",
                opacity: 0.8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "0.8";
              }}
            >
              ×
            </span>
          </Tag>
        </div>
      </div>
    );
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={links.map((link) => link.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="quick-links-tags">
            {links.length === 0 ? (
              <div className="empty-links">点击"添加"按钮添加快速链接</div>
            ) : (
              links.map((link) => (
                <SortableLinkItem key={link.id} link={link} />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

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
                  const trimmedValue = value.trim();
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
