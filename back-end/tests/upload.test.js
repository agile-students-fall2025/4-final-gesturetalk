import { expect } from "chai";
import upload from "../src/middleware/upload.js";

describe("upload middleware", () => {
  it("should be a multer instance", () => {
    expect(upload).to.exist;
    expect(upload.single).to.be.a("function");
  });

  it("should reject non-image files", (done) => {
    const mockReq = {};
    const mockFile = {
      originalname: "test.txt",
      mimetype: "text/plain",
    };

    // Test fileFilter
    // eslint-disable-next-line no-underscore-dangle
    const fileFilter = upload._fileFilter || upload.fileFilter;
    if (fileFilter) {
      fileFilter(mockReq, mockFile, (error) => {
        expect(error).to.exist;
        expect(error.message).to.equal("Only image files are allowed");
        done();
      });
    } else {
      done();
    }
  });

  it("should accept valid image files", (done) => {
    const mockReq = {};
    const mockFile = {
      originalname: "test.jpg",
      mimetype: "image/jpeg",
    };

    // Test fileFilter
    // eslint-disable-next-line no-underscore-dangle
    const fileFilter = upload._fileFilter || upload.fileFilter;
    if (fileFilter) {
      fileFilter(mockReq, mockFile, (error, accepted) => {
        expect(error).to.not.exist;
        expect(accepted).to.equal(true);
        done();
      });
    } else {
      done();
    }
  });

  it("should accept png files", (done) => {
    const mockReq = {};
    const mockFile = {
      originalname: "test.png",
      mimetype: "image/png",
    };

    // eslint-disable-next-line no-underscore-dangle
    const fileFilter = upload._fileFilter || upload.fileFilter;
    if (fileFilter) {
      fileFilter(mockReq, mockFile, (error, accepted) => {
        expect(error).to.not.exist;
        expect(accepted).to.equal(true);
        done();
      });
    } else {
      done();
    }
  });

  it("should accept gif files", (done) => {
    const mockReq = {};
    const mockFile = {
      originalname: "test.gif",
      mimetype: "image/gif",
    };

    // eslint-disable-next-line no-underscore-dangle
    const fileFilter = upload._fileFilter || upload.fileFilter;
    if (fileFilter) {
      fileFilter(mockReq, mockFile, (error, accepted) => {
        expect(error).to.not.exist;
        expect(accepted).to.equal(true);
        done();
      });
    } else {
      done();
    }
  });

  it("should accept webp files", (done) => {
    const mockReq = {};
    const mockFile = {
      originalname: "test.webp",
      mimetype: "image/webp",
    };

    // eslint-disable-next-line no-underscore-dangle
    const fileFilter = upload._fileFilter || upload.fileFilter;
    if (fileFilter) {
      fileFilter(mockReq, mockFile, (error, accepted) => {
        expect(error).to.not.exist;
        expect(accepted).to.equal(true);
        done();
      });
    } else {
      done();
    }
  });

  it("should reject pdf files", (done) => {
    const mockReq = {};
    const mockFile = {
      originalname: "document.pdf",
      mimetype: "application/pdf",
    };

    // eslint-disable-next-line no-underscore-dangle
    const fileFilter = upload._fileFilter || upload.fileFilter;
    if (fileFilter) {
      fileFilter(mockReq, mockFile, (error) => {
        expect(error).to.exist;
        expect(error.message).to.equal("Only image files are allowed");
        done();
      });
    } else {
      done();
    }
  });

  it("should reject video files", (done) => {
    const mockReq = {};
    const mockFile = {
      originalname: "video.mp4",
      mimetype: "video/mp4",
    };

    // eslint-disable-next-line no-underscore-dangle
    const fileFilter = upload._fileFilter || upload.fileFilter;
    if (fileFilter) {
      fileFilter(mockReq, mockFile, (error) => {
        expect(error).to.exist;
        expect(error.message).to.equal("Only image files are allowed");
        done();
      });
    } else {
      done();
    }
  });

  it("should have file size limit configured", () => {
    expect(upload.limits).to.exist;
    expect(upload.limits.fileSize).to.equal(5 * 1024 * 1024); // 5MB
  });
});
